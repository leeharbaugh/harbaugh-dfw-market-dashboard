import "server-only";

import {
  getSeriesResultByMetricKey,
  type FredSeriesLoadResult,
  type FredSeriesLoadSuccess,
} from "@/lib/data/fred-fetch-registry";
import { getFredSeriesRegistry } from "@/lib/fred/registry-cache";
import {
  DashboardMetricKey,
  METRIC_KEY_TO_TITLE,
  TITLE_TO_METRIC_KEY,
} from "@/lib/data/fred-series-map";
import {
  fetchTrercSeriesRegistry,
  getTrercSeriesResultByMetricKey,
  trercSeriesLabel,
  type TrercSeriesLoadResult,
  type TrercSeriesLoadSuccess,
} from "@/lib/data/trerc-fetch-registry";
import {
  TITLE_TO_TRERC_METRIC_KEY,
  type TrercDashboardMetricKey,
} from "@/lib/data/trerc-series-map";
import type { ChangeKind } from "@/lib/dashboard/metric-changes";
import {
  alignDualSeries,
  isoDateToUpdatedThrough,
  observationsToChartPoints,
} from "@/lib/data/fred-transforms";
import type { FredSeriesDefinition } from "@/lib/data/fred-series-map";
import {
  buildDashboardMetrics,
  type DashboardBundle,
  type DashboardMetric,
  type MetricDataStatus,
} from "@/lib/dfw-dashboard-sample-data";
import { isFredConfigured } from "@/lib/fred/client";
import { isTrercLiveFetchEnabled } from "@/lib/trerc/client";

function changeKindForFred(
  definition: FredSeriesDefinition,
  metric: DashboardMetric,
): ChangeKind {
  switch (definition.transform) {
    case "cpiYearOverYear":
      return "inflationFromIndex";
    case "gdpYearOverYear":
      return "points";
    case "trillionsFromMillions":
    case "trillionsFromBillions":
      return "percent";
    default:
      if (metric.format === "pct2") return "points";
      return metric.changeKind ?? "percent";
  }
}

function changeBasePointsForFred(
  success: FredSeriesLoadSuccess,
  definition: FredSeriesDefinition,
): DashboardMetric["changeBasePoints"] {
  if (
    definition.transform === "cpiYearOverYear" ||
    definition.transform === "trillionsFromMillions" ||
    definition.transform === "trillionsFromBillions"
  ) {
    return observationsToChartPoints(success.rawObservations);
  }
  return undefined;
}

function applyLiveMetric(
  metric: DashboardMetric,
  success: FredSeriesLoadSuccess,
): DashboardMetric {
  const { definition } = success;
  const changeKind = changeKindForFred(definition, metric);
  return {
    ...metric,
    points: success.points,
    dataStatus: "live",
    fredSeriesId: success.resolvedSeriesId,
    latestObservationDate: success.lastDate,
    updatedThrough: isoDateToUpdatedThrough(success.lastDate),
    statusNote: undefined,
    comparisonLabels: definition.comparisonLabels,
    comparisonOffsets: definition.comparisonOffsets,
    changeKind,
    changeBasePoints: changeBasePointsForFred(success, definition),
  };
}

function applyTrercLiveMetric(
  metric: DashboardMetric,
  success: TrercSeriesLoadSuccess,
): DashboardMetric {
  const isMonthsSupply = metric.format === "ratioMo";
  return {
    ...metric,
    points: success.points,
    dataStatus: "live",
    source: success.sourceLabel,
    trercSeriesId: trercSeriesLabel(success.definition),
    latestObservationDate: success.lastDate,
    updatedThrough: isoDateToUpdatedThrough(success.lastDate),
    statusNote: undefined,
    changeKind: isMonthsSupply ? "absolute" : metric.changeKind,
  };
}

function applyErrorMetric(
  metric: DashboardMetric,
  seriesId: string | undefined,
  error: string,
  options?: { useTrercId?: boolean },
): DashboardMetric {
  return {
    ...metric,
    dataStatus: "error",
    fredSeriesId: options?.useTrercId ? undefined : seriesId,
    trercSeriesId: options?.useTrercId ? seriesId : undefined,
    statusNote: error,
  };
}

function resolveFredMetric(
  metric: DashboardMetric,
  metricKey: DashboardMetricKey,
  registry: Map<string, FredSeriesLoadResult>,
): DashboardMetric {
  const result = getSeriesResultByMetricKey(registry, metricKey);

  if (!result) {
    return { ...metric, dataStatus: "fallback" };
  }

  if (result.ok) {
    return applyLiveMetric(metric, result);
  }

  if (result.error === "FRED_API_KEY not configured") {
    return { ...metric, dataStatus: "fallback", statusNote: undefined };
  }

  const seriesId =
    result.attemptedSeriesIds[result.attemptedSeriesIds.length - 1] ??
    result.definition.seriesId;
  return applyErrorMetric(metric, seriesId, result.error);
}

function applyFredToSection(
  metrics: DashboardMetric[],
  registry: Map<string, FredSeriesLoadResult>,
): DashboardMetric[] {
  return metrics.map((metric) => {
    const metricKey = TITLE_TO_METRIC_KEY[metric.title];
    if (!metricKey) {
      return metric;
    }
    return resolveFredMetric(metric, metricKey, registry);
  });
}

function resolveTrercMetric(
  metric: DashboardMetric,
  metricKey: TrercDashboardMetricKey,
  registry: Map<string, TrercSeriesLoadResult>,
): DashboardMetric {
  const result = getTrercSeriesResultByMetricKey(registry, metricKey);

  if (!result) {
    return { ...metric, dataStatus: "fallback" };
  }

  if (result.ok) {
    return applyTrercLiveMetric(metric, result);
  }

  if (result.error === "TRERC live fetch disabled") {
    return { ...metric, dataStatus: "fallback", statusNote: undefined };
  }

  return applyErrorMetric(
    metric,
    trercSeriesLabel(result.definition),
    result.error,
    { useTrercId: true },
  );
}

function applyTrercToSection(
  metrics: DashboardMetric[],
  registry: Map<string, TrercSeriesLoadResult>,
): DashboardMetric[] {
  return metrics.map((metric) => {
    const metricKey = TITLE_TO_TRERC_METRIC_KEY[metric.title];
    if (!metricKey) {
      return metric;
    }
    return resolveTrercMetric(metric, metricKey, registry);
  });
}

function applyDualLineMetric(
  metric: DashboardMetric,
  registry: Map<string, FredSeriesLoadResult>,
): DashboardMetric {
  const mortgage = getSeriesResultByMetricKey(
    registry,
    DashboardMetricKey.MORTGAGE_30Y,
  );
  const treasury = getSeriesResultByMetricKey(
    registry,
    DashboardMetricKey.TREASURY_10Y,
  );

  const mortgageOk = mortgage?.ok === true ? mortgage : null;
  const treasuryOk = treasury?.ok === true ? treasury : null;

  if (mortgageOk && treasuryOk) {
    const aligned = alignDualSeries(mortgageOk.points, treasuryOk.points);
    const lastDate =
      mortgageOk.lastDate >= treasuryOk.lastDate
        ? mortgageOk.lastDate
        : treasuryOk.lastDate;

    return {
      ...metric,
      points: aligned.primary,
      pointsSecondary: aligned.secondary,
      dataStatus: "live",
      fredSeriesId: "MORTGAGE30US + DGS10",
      latestObservationDate: lastDate,
      updatedThrough: isoDateToUpdatedThrough(lastDate),
      statusNote: undefined,
    };
  }

  const notConfigured =
    mortgage?.ok === false &&
    mortgage.error === "FRED_API_KEY not configured" &&
    treasury?.ok === false &&
    treasury.error === "FRED_API_KEY not configured";

  if (notConfigured) {
    return { ...metric, dataStatus: "fallback" };
  }

  const errors: string[] = [];
  if (mortgage && !mortgage.ok) {
    errors.push(`MORTGAGE30US: ${mortgage.error}`);
  }
  if (treasury && !treasury.ok) {
    errors.push(`DGS10: ${treasury.error}`);
  }

  return applyErrorMetric(
    metric,
    "MORTGAGE30US + DGS10",
    errors.join("; ") || "FRED fetch failed",
  );
}

function applyFredToNational(
  national: DashboardMetric[],
  registry: Map<string, FredSeriesLoadResult>,
): DashboardMetric[] {
  const dualTitle =
    METRIC_KEY_TO_TITLE[DashboardMetricKey.MORTGAGE_VS_TREASURY];

  return national.map((metric) => {
    if (metric.title === dualTitle) {
      return applyDualLineMetric(metric, registry);
    }

    const metricKey = TITLE_TO_METRIC_KEY[metric.title];
    if (!metricKey) {
      return metric;
    }

    return resolveFredMetric(metric, metricKey, registry);
  });
}

export type LoadDashboardDataOptions = {
  /** When true, bypass the assembled FRED cache and refetch from the API. */
  fredForceLive?: boolean;
};

/**
 * Builds the full dashboard bundle, overlaying live FRED data on national
 * metrics and live TRERC housing data on DFW / Arlington / Mansfield when available.
 */
export async function loadDashboardData(
  seed = 0,
  options?: LoadDashboardDataOptions,
): Promise<DashboardBundle> {
  const sample = buildDashboardMetrics(seed);
  const [fredRegistry, trercRegistry] = await Promise.all([
    getFredSeriesRegistry({ forceLive: options?.fredForceLive }),
    fetchTrercSeriesRegistry(),
  ]);

  const national = applyFredToNational(sample.national, fredRegistry);
  let dfw = applyTrercToSection(sample.dfw, trercRegistry);
  dfw = applyFredToSection(dfw, fredRegistry);
  const arlington = applyTrercToSection(sample.arlington, trercRegistry);
  const mansfield = applyTrercToSection(sample.mansfield, trercRegistry);
  const regional = applyFredToSection(sample.regional, fredRegistry);

  const bundle: DashboardBundle = {
    ...sample,
    national,
    dfw,
    arlington,
    mansfield,
    regional,
  };

  return bundle;
}

export async function getDashboardDataSourceStatus(): Promise<{
  fredConfigured: boolean;
  trercConfigured: boolean;
  counts: Record<MetricDataStatus, number>;
}> {
  const bundle = await loadDashboardData(0);
  const all = [
    ...bundle.dfw,
    ...bundle.arlington,
    ...bundle.mansfield,
    ...bundle.national,
    ...bundle.regional,
  ];
  const counts: Record<MetricDataStatus, number> = {
    live: 0,
    fallback: 0,
    error: 0,
  };
  for (const m of all) {
    counts[m.dataStatus] += 1;
  }
  return {
    fredConfigured: isFredConfigured(),
    trercConfigured: isTrercLiveFetchEnabled(),
    counts,
  };
}
