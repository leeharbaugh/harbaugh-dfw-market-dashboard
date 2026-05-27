import type { ChartPoint, DashboardMetric } from "@/lib/dfw-dashboard-sample-data";
import {
  formatDeltaAbsolute,
  formatDeltaPct,
  formatDeltaPoints,
  pctChange,
} from "@/lib/format-metric";

export type ChangeKind =
  | "percent"
  | "absolute"
  | "points"
  | "inflationFromIndex";

export type ComputedMetricChanges = {
  short: number | null;
  mid: number | null;
  long: number | null;
  method: string;
};

function valueAt(
  points: ChartPoint[],
  index: number,
): number | undefined {
  const v = points[index]?.value;
  return v !== undefined && Number.isFinite(v) ? v : undefined;
}

function inflationRate(
  current: number,
  prior: number | undefined,
): number | null {
  if (prior === undefined || prior === 0 || !Number.isFinite(prior)) {
    return null;
  }
  return (current / prior - 1) * 100;
}

function pointChange(
  current: number,
  prior: number | undefined,
): number | null {
  if (prior === undefined || !Number.isFinite(prior)) {
    return null;
  }
  return current - prior;
}

export function inferChangeKind(metric: DashboardMetric): ChangeKind {
  if (metric.changeKind) return metric.changeKind;
  if (metric.format === "ratioMo") return "absolute";
  if (metric.title.includes("CPI Inflation")) return "points";
  if (
    metric.format === "pct2" &&
    (metric.title.includes("Rate") ||
      metric.title.includes("Unemployment") ||
      metric.title.includes("GDP"))
  ) {
    return "points";
  }
  return "percent";
}

export function computeMetricChanges(
  metric: DashboardMetric,
): ComputedMetricChanges {
  const displayPoints = metric.points;
  const basePoints = metric.changeBasePoints ?? displayPoints;
  const kind = inferChangeKind(metric);
  const [off1, off3, off12] = metric.comparisonOffsets ?? [1, 3, 12];
  const lastIdx = displayPoints.length - 1;
  const baseLastIdx = basePoints.length - 1;

  const displayCurrent = valueAt(displayPoints, lastIdx) ?? 0;
  const baseCurrent = valueAt(basePoints, baseLastIdx) ?? displayCurrent;
  const prior1 = valueAt(basePoints, baseLastIdx - off1);
  const prior3 = valueAt(basePoints, baseLastIdx - off3);
  const prior12 = valueAt(basePoints, baseLastIdx - off12);

  let short: number | null;
  let mid: number | null;
  let long: number | null;
  let method: string;

  switch (kind) {
    case "absolute":
      short = pointChange(baseCurrent, prior1);
      mid = pointChange(baseCurrent, prior3);
      long = pointChange(baseCurrent, prior12);
      method = "absolute (level difference)";
      break;
    case "points":
      short = pointChange(displayCurrent, valueAt(displayPoints, lastIdx - off1));
      mid = pointChange(displayCurrent, valueAt(displayPoints, lastIdx - off3));
      long = pointChange(
        displayCurrent,
        valueAt(displayPoints, lastIdx - off12),
      );
      method = "percentage-point (rate or inflation-rate difference)";
      break;
    case "inflationFromIndex":
      short = inflationRate(baseCurrent, prior1);
      mid = inflationRate(baseCurrent, prior3);
      long = inflationRate(baseCurrent, prior12);
      method =
        "inflation % from CPI index ((current/prior)-1)×100 on raw index levels";
      break;
    case "percent":
    default:
      short = pctChange(baseCurrent, prior1 ?? baseCurrent);
      mid = pctChange(baseCurrent, prior3 ?? baseCurrent);
      long = pctChange(baseCurrent, prior12 ?? baseCurrent);
      method = metric.changeBasePoints
        ? "percent change on raw level values (pre-display scaling)"
        : "percent change on displayed series";
      break;
  }

  return { short, mid, long, method };
}

export function formatMetricChange(
  value: number | null,
  kind: ChangeKind,
): string {
  switch (kind) {
    case "absolute":
      return formatDeltaAbsolute(value);
    case "points":
      return formatDeltaPoints(value);
    case "inflationFromIndex":
    case "percent":
    default:
      return formatDeltaPct(value);
  }
}
