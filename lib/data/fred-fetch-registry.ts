import "server-only";

import type {
  DashboardMetricKey,
  FredSeriesDefinition,
} from "@/lib/data/fred-series-map";
import { FRED_DASHBOARD_SERIES } from "@/lib/data/fred-series-map";
import {
  observationsToChartPoints,
  transformFredObservations,
} from "@/lib/data/fred-transforms";
import {
  fetchFredObservations,
  isFredConfigured,
} from "@/lib/fred/client";
import type { FredObservation } from "@/lib/fred/types";
import type { DashboardMetric } from "@/lib/dfw-dashboard-sample-data";

export type FredSeriesLoadSuccess = {
  ok: true;
  definition: FredSeriesDefinition;
  resolvedSeriesId: string;
  rawObservations: FredObservation[];
  normalizedObservations: FredObservation[];
  points: DashboardMetric["points"];
  lastDate: string;
  lastRaw: FredObservation;
  lastNormalized: FredObservation;
};

export type FredSeriesLoadFailure = {
  ok: false;
  definition: FredSeriesDefinition;
  error: string;
  attemptedSeriesIds: string[];
};

export type FredSeriesLoadResult = FredSeriesLoadSuccess | FredSeriesLoadFailure;

/** Keep low to stay under FRED burst limits (~2 req/s guidance). */
const FRED_FETCH_CONCURRENCY = 2;
const FRED_FETCH_STAGGER_MS = 350;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      results[index] = await fn(items[index]!);
      if (FRED_FETCH_STAGGER_MS > 0) {
        await sleep(FRED_FETCH_STAGGER_MS);
      }
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(
    Array.from({ length: workerCount }, () => worker()),
  );
  return results;
}

async function fetchSeriesObservations(
  seriesId: string,
  observationStart: string,
): Promise<FredObservation[] | null> {
  const result = await fetchFredObservations({ seriesId, observationStart });
  return result?.observations ?? null;
}

async function resolveFredObservations(
  definition: FredSeriesDefinition,
): Promise<
  | { observations: FredObservation[]; resolvedSeriesId: string }
  | { error: string; attemptedSeriesIds: string[] }
> {
  const attemptedSeriesIds = [
    definition.seriesId,
    ...(definition.fallbackSeriesIds ?? []),
  ];

  for (const seriesId of attemptedSeriesIds) {
    try {
      const observations = await fetchSeriesObservations(
        seriesId,
        definition.observationStart,
      );
      if (observations === null) {
        return {
          error: "FRED_API_KEY not configured",
          attemptedSeriesIds,
        };
      }
      if (observations.length > 0) {
        if (seriesId !== definition.seriesId) {
          console.warn(
            `[fred] Primary series ${definition.seriesId} unavailable; ` +
              `using fallback ${seriesId} for ${definition.id}`,
          );
        }
        return { observations, resolvedSeriesId: seriesId };
      }
      console.warn(
        `[fred] ${seriesId} returned no observations for ${definition.id}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown FRED error";
      console.warn(`[fred] ${seriesId} failed for ${definition.id}: ${message}`);
    }
  }

  return {
    error: `No observations from FRED for ${attemptedSeriesIds.join(", ")}`,
    attemptedSeriesIds,
  };
}

async function loadOneFredSeries(
  definition: FredSeriesDefinition,
): Promise<FredSeriesLoadResult> {
  if (!isFredConfigured()) {
    return {
      ok: false,
      definition,
      error: "FRED_API_KEY not configured",
      attemptedSeriesIds: [definition.seriesId],
    };
  }

  try {
    const resolved = await resolveFredObservations(definition);
    if ("error" in resolved) {
      return {
        ok: false,
        definition,
        error: resolved.error,
        attemptedSeriesIds: resolved.attemptedSeriesIds,
      };
    }

    const normalized = transformFredObservations(
      resolved.observations,
      definition.transform,
    );

    if (normalized.length === 0) {
      return {
        ok: false,
        definition,
        error: "No observations after transform",
        attemptedSeriesIds: [
          definition.seriesId,
          ...(definition.fallbackSeriesIds ?? []),
        ],
      };
    }

    const lastRaw = resolved.observations[resolved.observations.length - 1];
    const lastNormalized = normalized[normalized.length - 1];
    const success: FredSeriesLoadSuccess = {
      ok: true,
      definition,
      resolvedSeriesId: resolved.resolvedSeriesId,
      rawObservations: resolved.observations,
      normalizedObservations: normalized,
      points: observationsToChartPoints(normalized),
      lastDate: lastNormalized.date,
      lastRaw,
      lastNormalized,
    };

    return success;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown FRED error";
    return {
      ok: false,
      definition,
      error: message,
      attemptedSeriesIds: [definition.seriesId],
    };
  }
}

/**
 * Prefer successful series from `incoming`; fill gaps from `prior` when present.
 */
export function mergeFredRegistries(
  incoming: Map<string, FredSeriesLoadResult>,
  prior: Map<string, FredSeriesLoadResult>,
): Map<string, FredSeriesLoadResult> {
  const merged = new Map(incoming);
  for (const [id, priorResult] of prior) {
    const current = merged.get(id);
    if (priorResult.ok && current?.ok !== true) {
      merged.set(id, priorResult);
    }
  }
  return merged;
}

/** Re-fetches only series that are missing or failed in `registry`. */
export async function repairFailedFredSeries(
  registry: Map<string, FredSeriesLoadResult>,
): Promise<Map<string, FredSeriesLoadResult>> {
  const failedDefinitions = FRED_DASHBOARD_SERIES.filter(
    (definition) => registry.get(definition.id)?.ok !== true,
  );
  if (failedDefinitions.length === 0) {
    return registry;
  }

  console.warn(
    `[fred] Repairing ${failedDefinitions.length} failed series: ` +
      failedDefinitions.map((d) => d.id).join(", "),
  );

  const results = await mapWithConcurrency(
    failedDefinitions,
    FRED_FETCH_CONCURRENCY,
    (definition) => loadOneFredSeries(definition),
  );

  const repaired = new Map(registry);
  for (const result of results) {
    repaired.set(result.definition.id, result);
  }
  return repaired;
}

/** Fetches all FRED series from the API (no shared cache). */
export async function fetchFredSeriesRegistryLive(
  prior?: Map<string, FredSeriesLoadResult>,
): Promise<Map<string, FredSeriesLoadResult>> {
  const registry = new Map<string, FredSeriesLoadResult>();

  if (!isFredConfigured()) {
    for (const definition of FRED_DASHBOARD_SERIES) {
      registry.set(definition.id, {
        ok: false,
        definition,
        error: "FRED_API_KEY not configured",
        attemptedSeriesIds: [definition.seriesId],
      });
    }
    return registry;
  }

  const results = await mapWithConcurrency(
    FRED_DASHBOARD_SERIES,
    FRED_FETCH_CONCURRENCY,
    (definition) => loadOneFredSeries(definition),
  );

  for (const result of results) {
    registry.set(result.definition.id, result);
  }

  const merged = prior ? mergeFredRegistries(registry, prior) : registry;
  return repairFailedFredSeries(merged);
}

export function getSeriesResultByMetricKey(
  registry: Map<string, FredSeriesLoadResult>,
  metricKey: DashboardMetricKey,
): FredSeriesLoadResult | undefined {
  for (const result of registry.values()) {
    if (result.definition.metricKeys.includes(metricKey)) {
      return result;
    }
  }
  return undefined;
}
