import type { DashboardMetric } from "@/lib/dfw-dashboard-sample-data";

export type MetricDataStatus = "live" | "fallback" | "error";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MONTH_NAMES_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Display date from chart label (e.g. Apr '26 → April 2026). */
export function chartLabelToUpdatedThrough(label: string): string | undefined {
  const match = /^(\w+)\s+[''\u2019](\d{2})$/.exec(label.trim());
  if (!match) return undefined;
  const monthIdx = MONTH_NAMES.indexOf(match[1]);
  const month =
    monthIdx >= 0 ? MONTH_NAMES_FULL[monthIdx] : match[1];
  const year = 2000 + Number.parseInt(match[2], 10);
  return `${month} ${year}`;
}

export type DashboardMetricDraft = Omit<DashboardMetric, "dataStatus"> &
  Partial<Pick<DashboardMetric, "dataStatus">>;

export function withFallbackMetadata(metric: DashboardMetricDraft): DashboardMetric {
  const lastLabel = metric.points[metric.points.length - 1]?.label;
  return {
    ...metric,
    dataStatus: "fallback",
    updatedThrough: lastLabel
      ? chartLabelToUpdatedThrough(lastLabel)
      : metric.updatedThrough,
  };
}

export function annotateBundleFallback(
  metrics: DashboardMetricDraft[],
): DashboardMetric[] {
  return metrics.map(withFallbackMetadata);
}
