import "server-only";

import {
  computeMetricChanges,
  formatMetricChange,
  inferChangeKind,
} from "@/lib/dashboard/metric-changes";
import type {
  DashboardBundle,
  DashboardMetric,
} from "@/lib/dfw-dashboard-sample-data";
import { formatMetricValue } from "@/lib/format-metric";

/**
 * Builds a compact, deterministic, plain-text summary of the current
 * dashboard state. This summary is passed to the model as factual
 * grounding so the generated notes describe what visitors are actually
 * seeing on the page — and so the model has no reason to hallucinate
 * figures it cannot derive from the inputs.
 */
export function buildMarketNotesGrounding(data: DashboardBundle): string {
  const sections: Array<{ heading: string; metrics: DashboardMetric[] }> = [
    { heading: "DFW housing market", metrics: data.dfw },
    { heading: "Arlington housing market", metrics: data.arlington },
    { heading: "Mansfield housing market", metrics: data.mansfield },
    { heading: "National economy / rates", metrics: data.national },
    { heading: "Regional (Texas / DFW)", metrics: data.regional },
  ];

  const lines: string[] = [];
  for (const section of sections) {
    if (!section.metrics.length) continue;
    lines.push(`## ${section.heading}`);
    for (const metric of section.metrics) {
      lines.push(formatMetricLine(metric));
    }
    lines.push("");
  }

  return lines.join("\n").trim();
}

function formatMetricLine(metric: DashboardMetric): string {
  const last = metric.points[metric.points.length - 1]?.value;
  const latestValue =
    typeof last === "number" ? formatMetricValue(last, metric.format) : "n/a";

  const kind = inferChangeKind(metric);
  const changes = computeMetricChanges(metric);
  const [label1, label3, label12] = metric.comparisonLabels ?? [
    "MoM",
    "3-mo",
    "YoY",
  ];

  const deltas = [
    `${label1} ${formatMetricChange(changes.short, kind)}`,
    `${label3} ${formatMetricChange(changes.mid, kind)}`,
    `${label12} ${formatMetricChange(changes.long, kind)}`,
  ].join(", ");

  const through = metric.updatedThrough ? ` (through ${metric.updatedThrough})` : "";
  const status =
    metric.dataStatus === "live"
      ? ""
      : ` [${metric.dataStatus}${metric.statusNote ? `: ${metric.statusNote}` : ""}]`;

  return `- ${metric.title}: ${latestValue}${through} — ${deltas}${status}`;
}
