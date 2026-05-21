import "server-only";

import type {
  DashboardMetricKey,
  FredSeriesDefinition,
} from "@/lib/data/fred-series-map";
import {
  FRED_DASHBOARD_SERIES,
  METRIC_KEY_TO_TITLE,
} from "@/lib/data/fred-series-map";
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

function metricTitlesForDefinition(definition: FredSeriesDefinition): string[] {
  return definition.metricKeys.map((key) => METRIC_KEY_TO_TITLE[key]);
}

function logFredMetricAudit(
  definition: FredSeriesDefinition,
  result: FredSeriesLoadResult,
): void {
  const metricNames = metricTitlesForDefinition(definition).join("; ");
  if (result.ok) {
    const first = result.rawObservations[0];
    const last = result.rawObservations[result.rawObservations.length - 1];
    console.log("[fred] Metric audit — LIVE");
    console.log(`  metric: ${metricNames}`);
    console.log(`  FRED series: ${result.resolvedSeriesId}`);
    console.log(`  observations: ${result.rawObservations.length}`);
    console.log(
      `  first: ${first?.date ?? "—"} = ${first?.value ?? "—"} (raw) → ${result.normalizedObservations[0]?.value ?? "—"} (normalized)`,
    );
    console.log(
      `  latest: ${last?.date ?? "—"} = ${last?.value ?? "—"} (raw) → ${result.lastNormalized.value} (normalized)`,
    );
    return;
  }

  const status =
    result.error === "FRED_API_KEY not configured" ? "FALLBACK" : "ERROR";
  console.log(`[fred] Metric audit — ${status}`);
  console.log(`  metric: ${metricNames}`);
  console.log(`  FRED series attempted: ${result.attemptedSeriesIds.join(" → ")}`);
  console.log(`  observations: 0`);
  console.log(`  note: ${result.error}`);
  if (definition.id === "cpi_dfw" && result.error.includes("CUURS37ASA0")) {
    console.warn(
      "[fred] DFW CPI: CUURS37ASA0 is not a valid FRED series_id. " +
        "Use BLS area code mapping CUURA316SA0 (Dallas-Fort Worth-Arlington, SA). " +
        "See https://fred.stlouisfed.org/series/CUURA316SA0",
    );
  }
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
    const failure: FredSeriesLoadFailure = {
      ok: false,
      definition,
      error: "FRED_API_KEY not configured",
      attemptedSeriesIds: [definition.seriesId],
    };
    logFredMetricAudit(definition, failure);
    return failure;
  }

  try {
    const resolved = await resolveFredObservations(definition);
    if ("error" in resolved) {
      const failure: FredSeriesLoadFailure = {
        ok: false,
        definition,
        error: resolved.error,
        attemptedSeriesIds: resolved.attemptedSeriesIds,
      };
      logFredMetricAudit(definition, failure);
      return failure;
    }

    const normalized = transformFredObservations(
      resolved.observations,
      definition.transform,
    );

    if (normalized.length === 0) {
      const failure: FredSeriesLoadFailure = {
        ok: false,
        definition,
        error: "No observations after transform",
        attemptedSeriesIds: [
          definition.seriesId,
          ...(definition.fallbackSeriesIds ?? []),
        ],
      };
      logFredMetricAudit(definition, failure);
      return failure;
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

    logFredMetricAudit(definition, success);
    return success;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown FRED error";
    const failure: FredSeriesLoadFailure = {
      ok: false,
      definition,
      error: message,
      attemptedSeriesIds: [definition.seriesId],
    };
    logFredMetricAudit(definition, failure);
    return failure;
  }
}

export async function fetchFredSeriesRegistry(): Promise<
  Map<string, FredSeriesLoadResult>
> {
  const registry = new Map<string, FredSeriesLoadResult>();

  if (!isFredConfigured()) {
    console.log("[fred] FRED_API_KEY not set — all FRED metrics use fallback");
    for (const definition of FRED_DASHBOARD_SERIES) {
      const failure: FredSeriesLoadFailure = {
        ok: false,
        definition,
        error: "FRED_API_KEY not configured",
        attemptedSeriesIds: [definition.seriesId],
      };
      registry.set(definition.id, failure);
      logFredMetricAudit(definition, failure);
    }
    return registry;
  }

  const results = await Promise.all(
    FRED_DASHBOARD_SERIES.map((definition) => loadOneFredSeries(definition)),
  );

  for (const result of results) {
    registry.set(result.definition.id, result);
  }

  return registry;
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
