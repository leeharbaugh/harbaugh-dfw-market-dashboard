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
};

export type FredSeriesLoadResult = FredSeriesLoadSuccess | FredSeriesLoadFailure;

function logFredSeriesDebug(success: FredSeriesLoadSuccess): void {
  const { definition, lastRaw, lastNormalized } = success;
  const { seriesId, transform } = definition;

  console.log(
    `[fred] ${seriesId} (${definition.id}) — fetched ${success.rawObservations.length} observations`,
  );
  console.log(
    `[fred] ${seriesId} last raw:`,
    { date: lastRaw.date, value: lastRaw.value, unit: transform },
  );
  console.log(
    `[fred] ${seriesId} last normalized:`,
    { date: lastNormalized.date, value: lastNormalized.value },
  );

  if (seriesId === "GFDEBTN") {
    const trillions = lastNormalized.value;
    console.log(
      `[fred] GFDEBTN check: ${lastRaw.value.toLocaleString()} millions → $${trillions.toFixed(1)}T`,
    );
  }
}

async function loadOneFredSeries(
  definition: FredSeriesDefinition,
): Promise<FredSeriesLoadResult> {
  try {
    const result = await fetchFredObservations({
      seriesId: definition.seriesId,
      observationStart: definition.observationStart,
    });

    if (!result) {
      return {
        ok: false,
        definition,
        error: "FRED_API_KEY not configured",
      };
    }

    const normalized = transformFredObservations(
      result.observations,
      definition.transform,
    );

    if (normalized.length === 0) {
      return {
        ok: false,
        definition,
        error: "No observations after transform",
      };
    }

    const lastRaw = result.observations[result.observations.length - 1];
    const lastNormalized = normalized[normalized.length - 1];
    const success: FredSeriesLoadSuccess = {
      ok: true,
      definition,
      rawObservations: result.observations,
      normalizedObservations: normalized,
      points: observationsToChartPoints(normalized),
      lastDate: lastNormalized.date,
      lastRaw,
      lastNormalized,
    };

    logFredSeriesDebug(success);
    return success;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown FRED error";
    console.error(`[fred] ${definition.seriesId} failed:`, message);
    return { ok: false, definition, error: message };
  }
}

export async function fetchFredSeriesRegistry(): Promise<
  Map<string, FredSeriesLoadResult>
> {
  const registry = new Map<string, FredSeriesLoadResult>();

  if (!isFredConfigured()) {
    console.log("[fred] FRED_API_KEY not set — all FRED metrics use fallback");
    for (const definition of FRED_DASHBOARD_SERIES) {
      registry.set(definition.id, {
        ok: false,
        definition,
        error: "FRED_API_KEY not configured",
      });
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
