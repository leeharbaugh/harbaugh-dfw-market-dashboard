import "server-only";

import { annotateBundleFallback } from "@/lib/dashboard/metric-metadata";
import {
  fetchFredSeriesRegistry,
  getSeriesResultByMetricKey,
  type FredSeriesLoadResult,
  type FredSeriesLoadSuccess,
} from "@/lib/data/fred-fetch-registry";
import {
  DashboardMetricKey,
  METRIC_KEY_TO_TITLE,
  TITLE_TO_METRIC_KEY,
} from "@/lib/data/fred-series-map";
import {
  alignDualSeries,
  isoDateToUpdatedThrough,
} from "@/lib/data/fred-transforms";
import {
  buildDashboardMetrics,
  type DashboardBundle,
  type DashboardMetric,
  type MetricDataStatus,
} from "@/lib/dfw-dashboard-sample-data";
import { isFredConfigured } from "@/lib/fred/client";

function applyLiveMetric(
  metric: DashboardMetric,
  success: FredSeriesLoadSuccess,
): DashboardMetric {
  return {
    ...metric,
    points: success.points,
    dataStatus: "live",
    fredSeriesId: success.definition.seriesId,
    latestObservationDate: success.lastDate,
    updatedThrough: isoDateToUpdatedThrough(success.lastDate),
    statusNote: undefined,
  };
}

function applyErrorMetric(
  metric: DashboardMetric,
  seriesId: string | undefined,
  error: string,
): DashboardMetric {
  return {
    ...metric,
    dataStatus: "error",
    fredSeriesId: seriesId,
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

  return applyErrorMetric(metric, result.definition.seriesId, result.error);
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

function logDashboardDataAudit(bundle: DashboardBundle): void {
  const all = [
    ...bundle.dfw,
    ...bundle.arlington,
    ...bundle.mansfield,
    ...bundle.national,
    ...bundle.regional,
  ];

  console.log("[dashboard] Metric data source audit:");
  for (const m of all) {
    const last = m.points[m.points.length - 1]?.value;
    console.log(
      `  • ${m.title}`,
      `| status=${m.dataStatus}`,
      m.fredSeriesId ? `| FRED=${m.fredSeriesId}` : "",
      m.updatedThrough ? `| through=${m.updatedThrough}` : "",
      last != null ? `| latest=${last}` : "",
      m.statusNote ? `| note=${m.statusNote}` : "",
    );
  }

  const live = all.filter((m) => m.dataStatus === "live").length;
  const fallback = all.filter((m) => m.dataStatus === "fallback").length;
  const error = all.filter((m) => m.dataStatus === "error").length;
  console.log(
    `[dashboard] Summary: ${live} live, ${fallback} fallback, ${error} error (${all.length} total)`,
  );
}

/**
 * Builds the full dashboard bundle, overlaying live FRED data on national
 * metrics when available. All other sections remain sample data (Phase 1).
 */
export async function loadDashboardData(
  seed = 0,
): Promise<DashboardBundle> {
  const sample = buildDashboardMetrics(seed);
  const registry = await fetchFredSeriesRegistry();
  const national = applyFredToNational(sample.national, registry);
  const bundle: DashboardBundle = { ...sample, national };

  logDashboardDataAudit(bundle);
  return bundle;
}

export async function getDashboardDataSourceStatus(): Promise<{
  fredConfigured: boolean;
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
  return { fredConfigured: isFredConfigured(), counts };
}
