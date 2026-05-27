import "server-only";

import {
  TRERC_DASHBOARD_SERIES,
  TRERC_GEOGRAPHIES,
  type TrercGeographyDefinition,
  type TrercSeriesDefinition,
} from "@/lib/data/trerc-series-map";
import { observationsToChartPoints } from "@/lib/data/fred-transforms";
import {
  fetchTrercGeographyHousingData,
  isTrercLiveFetchEnabled,
} from "@/lib/trerc/client";
import { TRERC_SOURCE_LABEL } from "@/lib/trerc/constants";
import type { TrercHousingTableRow, TrercObservation } from "@/lib/trerc/types";
import type { DashboardMetric } from "@/lib/dfw-dashboard-sample-data";
import type { TrercDashboardMetricKey } from "@/lib/data/trerc-series-map";

export type TrercSeriesLoadSuccess = {
  ok: true;
  definition: TrercSeriesDefinition;
  rawRows: TrercHousingTableRow[];
  normalizedObservations: TrercObservation[];
  points: DashboardMetric["points"];
  lastDate: string;
  lastNormalized: TrercObservation;
  sourceLabel: string;
};

export type TrercSeriesLoadFailure = {
  ok: false;
  definition: TrercSeriesDefinition;
  error: string;
};

export type TrercSeriesLoadResult =
  | TrercSeriesLoadSuccess
  | TrercSeriesLoadFailure;

type GeographyCacheEntry =
  | {
      ok: true;
      rawRows: TrercHousingTableRow[];
      observationsByField: Record<string, TrercObservation[]>;
    }
  | { ok: false; error: string };

async function loadGeography(
  geography: TrercGeographyDefinition,
): Promise<GeographyCacheEntry> {
  try {
    const result = await fetchTrercGeographyHousingData(
      geography.pageUrl,
      geography.geoData,
    );
    return {
      ok: true,
      rawRows: result.rawRows,
      observationsByField: result.observationsByField,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown TRERC error";
    console.error(
      `[trerc] Geography fetch failed (${geography.id}):`,
      message,
    );
    return { ok: false, error: message };
  }
}

function buildSeriesSuccess(
  definition: TrercSeriesDefinition,
  rawRows: TrercHousingTableRow[],
  observations: TrercObservation[],
): TrercSeriesLoadSuccess {
  const lastNormalized = observations[observations.length - 1];
  return {
    ok: true,
    definition,
    rawRows,
    normalizedObservations: observations,
    points: observationsToChartPoints(observations),
    lastDate: lastNormalized.date,
    lastNormalized,
    sourceLabel: TRERC_SOURCE_LABEL,
  };
}

function loadOneTrercSeries(
  definition: TrercSeriesDefinition,
  geographyCache: Map<string, GeographyCacheEntry>,
): TrercSeriesLoadResult {
  const cached = geographyCache.get(definition.geographyId);
  if (!cached) {
    return {
      ok: false,
      definition,
      error: `Geography cache miss: ${definition.geographyId}`,
    };
  }

  if (!cached.ok) {
    return { ok: false, definition, error: cached.error };
  }

  const observations = cached.observationsByField[definition.field] ?? [];
  if (observations.length === 0) {
    return {
      ok: false,
      definition,
      error: `No observations for field ${definition.field}`,
    };
  }

  return buildSeriesSuccess(definition, cached.rawRows, observations);
}

export async function fetchTrercSeriesRegistry(): Promise<
  Map<string, TrercSeriesLoadResult>
> {
  const registry = new Map<string, TrercSeriesLoadResult>();

  if (!isTrercLiveFetchEnabled()) {
    for (const definition of TRERC_DASHBOARD_SERIES) {
      registry.set(definition.id, {
        ok: false,
        definition,
        error: "TRERC live fetch disabled",
      });
    }
    return registry;
  }

  const geographyCache = new Map<string, GeographyCacheEntry>();
  const geographyResults = await Promise.all(
    TRERC_GEOGRAPHIES.map(async (geography) => {
      const entry = await loadGeography(geography);
      return [geography.id, entry] as const;
    }),
  );

  for (const [id, entry] of geographyResults) {
    geographyCache.set(id, entry);
  }

  for (const definition of TRERC_DASHBOARD_SERIES) {
    registry.set(
      definition.id,
      loadOneTrercSeries(definition, geographyCache),
    );
  }

  return registry;
}

export function getTrercSeriesResultByMetricKey(
  registry: Map<string, TrercSeriesLoadResult>,
  metricKey: TrercDashboardMetricKey,
): TrercSeriesLoadResult | undefined {
  for (const result of registry.values()) {
    if (result.definition.metricKeys.includes(metricKey)) {
      return result;
    }
  }
  return undefined;
}

export function trercSeriesLabel(definition: TrercSeriesDefinition): string {
  const geo = TRERC_GEOGRAPHIES.find((g) => g.id === definition.geographyId);
  const geoName = geo?.geoData.geoName ?? definition.geographyId;
  return `${geoName} · ${definition.field}`;
}
