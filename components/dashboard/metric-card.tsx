"use client";

import type { DashboardMetric } from "@/lib/dfw-dashboard-sample-data";
import { DataStatusBadge } from "@/components/dashboard/data-status-badge";
import { MetricHelpTooltip } from "@/components/dashboard/metric-help-tooltip";
import { MetricChart } from "@/components/dashboard/metric-chart";
import {
  computeMetricChanges,
  formatMetricChange,
  inferChangeKind,
} from "@/lib/dashboard/metric-changes";
import { getMetricHelpText } from "@/lib/dashboard/metric-help";
import { formatMetricValue } from "@/lib/format-metric";

type MetricCardProps = {
  metric: DashboardMetric;
};

export function MetricCard({ metric }: MetricCardProps) {
  const pts = metric.points;
  const lastIdx = pts.length - 1;
  const last = pts[lastIdx]?.value ?? 0;
  const [label1, label3, label12] = metric.comparisonLabels ?? [
    "MoM",
    "3-mo",
    "YoY",
  ];
  const kind = inferChangeKind(metric);
  const changes = computeMetricChanges(metric);
  const helpText = getMetricHelpText(metric.title);

  const badgeTitle = [
    metric.fredSeriesId ? `FRED: ${metric.fredSeriesId}` : null,
    metric.trercSeriesId ? `TRERC: ${metric.trercSeriesId}` : null,
    metric.statusNote,
    metric.latestObservationDate
      ? `Latest: ${metric.latestObservationDate}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="group flex flex-col overflow-visible rounded-2xl border border-stone-200/80 bg-white/70 p-3.5 shadow-sm shadow-stone-900/[0.04] ring-1 ring-stone-900/[0.02] backdrop-blur-sm transition-shadow hover:shadow-md hover:shadow-stone-900/[0.06] sm:p-4">
      <div className="flex items-start justify-between gap-2 overflow-visible">
        <div className="min-w-0 flex-1 overflow-visible">
          <h3 className="flex items-center gap-1.5 overflow-visible text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-stone-500">
            <span className="min-w-0">{metric.title}</span>
            {helpText ? (
              <MetricHelpTooltip text={helpText} metricName={metric.title} />
            ) : null}
          </h3>
          {metric.subtitle ? (
            <p className="mt-0.5 text-xs leading-snug text-stone-400">
              {metric.subtitle}
            </p>
          ) : null}
        </div>
        <DataStatusBadge
          status={metric.dataStatus}
          title={badgeTitle || undefined}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <p className="font-sans text-xl font-semibold tracking-tight text-stone-900 tabular-nums sm:text-2xl">
          {formatMetricValue(last, metric.format)}
        </p>
        <dl className="flex flex-wrap gap-x-3 gap-y-1 text-[0.7rem] text-stone-500 tabular-nums">
          <div className="flex items-baseline gap-1.5">
            <dt className="font-medium text-stone-400">{label1}</dt>
            <dd className="text-stone-700">
              {formatMetricChange(changes.short, kind)}
            </dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="font-medium text-stone-400">{label3}</dt>
            <dd className="text-stone-700">
              {formatMetricChange(changes.mid, kind)}
            </dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="font-medium text-stone-400">{label12}</dt>
            <dd className="text-stone-700">
              {formatMetricChange(changes.long, kind)}
            </dd>
          </div>
        </dl>
      </div>

      {metric.updatedThrough ? (
        <p className="mt-1 text-[0.65rem] text-stone-400 tabular-nums">
          Updated through {metric.updatedThrough}
        </p>
      ) : null}

      <div className="mt-2 w-full min-w-0">
        <MetricChart metric={metric} prominent />
      </div>

      {metric.source ? (
        <p className="mt-2 text-[0.65rem] leading-snug text-stone-400">
          Source: {metric.source}
        </p>
      ) : null}
    </article>
  );
}
