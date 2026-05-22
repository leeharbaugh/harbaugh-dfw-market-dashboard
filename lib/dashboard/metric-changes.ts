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

function logNationalDebtAudit(metric: DashboardMetric): void {
  const basePoints = metric.changeBasePoints ?? metric.points;
  const [offQoq, off3q, offYoy] = metric.comparisonOffsets ?? [1, 3, 4];
  const lastIdx = basePoints.length - 1;
  const current = basePoints[lastIdx];
  const priorQ = basePoints[lastIdx - offQoq];
  const prior3q = basePoints[lastIdx - off3q];
  const priorYoy = basePoints[lastIdx - offYoy];

  const rawCurrent = current?.value;
  const rawPriorQ = priorQ?.value;
  const rawPriorYoy = priorYoy?.value;

  const qoq =
    rawCurrent != null && rawPriorQ != null
      ? pctChange(rawCurrent, rawPriorQ)
      : null;
  const yoy =
    rawCurrent != null && rawPriorYoy != null
      ? pctChange(rawCurrent, rawPriorYoy)
      : null;

  console.log("[national-debt] GFDEBTN change audit");
  console.log("  latest date:", current?.label, metric.latestObservationDate);
  console.log("  latest raw value (millions):", rawCurrent);
  console.log(
    "  prior quarter:",
    priorQ?.label,
    rawPriorQ,
    `(offset ${offQoq} quarters)`,
  );
  console.log(
    "  prior year (4 quarters):",
    priorYoy?.label,
    rawPriorYoy,
    `(offset ${offYoy} quarters)`,
  );
  console.log("  calculated QoQ %:", qoq);
  console.log("  calculated YoY %:", yoy);
  console.log(
    "  displayed headline:",
    metric.points[metric.points.length - 1]?.value,
    "trillions",
  );
  console.log("  displayed changes:", {
    QoQ: formatMetricChange(qoq, "percent"),
    "3-qtr": formatMetricChange(
      rawCurrent != null && prior3q?.value != null
        ? pctChange(rawCurrent, prior3q.value)
        : null,
      "percent",
    ),
    YoY: formatMetricChange(yoy, "percent"),
  });
}

export function logMetricChangeAudit(metric: DashboardMetric): void {
  const kind = inferChangeKind(metric);
  const changes = computeMetricChanges(metric);
  const displayPoints = metric.points;
  const basePoints = metric.changeBasePoints ?? displayPoints;
  const [off1, off3, off12] = metric.comparisonOffsets ?? [1, 3, 12];
  const lastIdx = displayPoints.length - 1;
  const baseLastIdx = basePoints.length - 1;

  if (metric.title.includes("National Debt")) {
    logNationalDebtAudit(metric);
  }

  console.log("[metric-changes]", metric.title);
  console.log("  current (display):", displayPoints[lastIdx]?.value);
  console.log(
    "  prior short-term:",
    basePoints[baseLastIdx - off1]?.value,
    basePoints[baseLastIdx - off1]?.label,
    `(offset ${off1})`,
  );
  console.log(
    "  prior mid-term:",
    basePoints[baseLastIdx - off3]?.value,
    basePoints[baseLastIdx - off3]?.label,
    `(offset ${off3})`,
  );
  console.log(
    "  prior long-term:",
    basePoints[baseLastIdx - off12]?.value,
    basePoints[baseLastIdx - off12]?.label,
    `(offset ${off12})`,
  );
  console.log("  calculation method:", changes.method, `| kind=${kind}`);
  console.log("  displayed changes:", {
    short: formatMetricChange(changes.short, kind),
    mid: formatMetricChange(changes.mid, kind),
    long: formatMetricChange(changes.long, kind),
  });
}
