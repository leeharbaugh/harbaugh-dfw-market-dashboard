"use client";

import type { DashboardMetric } from "@/lib/dfw-dashboard-sample-data";
import { CHART } from "@/lib/chart-palette";
import { DataStatusBadge } from "@/components/dashboard/data-status-badge";
import { MetricChart } from "@/components/dashboard/metric-chart";
import { MetricHelpTooltip } from "@/components/dashboard/metric-help-tooltip";
import { getMetricHelpText } from "@/lib/dashboard/metric-help";
import { formatMetricValue } from "@/lib/format-metric";

type DualRateMetricCardProps = {
  metric: DashboardMetric;
};

export function DualRateMetricCard({ metric }: DualRateMetricCardProps) {
  const mortgage = metric.points[metric.points.length - 1]?.value ?? 0;
  const treasury =
    metric.pointsSecondary?.[metric.pointsSecondary.length - 1]?.value ?? 0;
  const spread = mortgage - treasury;
  const helpText = getMetricHelpText(metric.title);

  const badgeTitle = [
    metric.fredSeriesId ? `FRED: ${metric.fredSeriesId}` : null,
    metric.statusNote,
    metric.latestObservationDate
      ? `Latest: ${metric.latestObservationDate}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="overflow-visible rounded-2xl border border-stone-200/80 bg-white/70 p-4 shadow-sm shadow-stone-900/[0.04] ring-1 ring-stone-900/[0.02] backdrop-blur-sm sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 shrink-0 overflow-visible lg:max-w-sm">
          <div className="flex items-start justify-between gap-2 overflow-visible">
            <div className="min-w-0 flex-1 overflow-visible">
              <h3 className="flex items-center gap-1.5 overflow-visible text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-stone-500">
                <span className="min-w-0">{metric.title}</span>
                {helpText ? <MetricHelpTooltip text={helpText} /> : null}
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
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            <div>
              <p className="text-[0.65rem] font-medium uppercase tracking-wider text-stone-400">
                30-yr mortgage
              </p>
              <p className="text-lg font-semibold tabular-nums text-stone-900">
                {formatMetricValue(mortgage, metric.format)}
              </p>
            </div>
            <div>
              <p className="text-[0.65rem] font-medium uppercase tracking-wider text-stone-400">
                10-yr Treasury
              </p>
              <p className="text-lg font-semibold tabular-nums text-stone-900">
                {formatMetricValue(
                  treasury,
                  metric.formatSecondary ?? metric.format,
                )}
              </p>
            </div>
            <div>
              <p className="text-[0.65rem] font-medium uppercase tracking-wider text-stone-400">
                Spread
              </p>
              <p className="text-lg font-semibold tabular-nums text-[#1e3a5f]">
                {formatMetricValue(spread, "spread")}
              </p>
            </div>
          </div>
          {metric.updatedThrough ? (
            <p className="mt-2 text-[0.65rem] text-stone-400 tabular-nums">
              Updated through {metric.updatedThrough}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-stone-500">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-0.5 w-4 rounded-full"
                style={{ backgroundColor: metric.color ?? CHART.navy }}
              />
              30-yr mortgage
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-0.5 w-4 rounded-full"
                style={{
                  backgroundColor: metric.colorSecondary ?? CHART.mutedGold,
                }}
              />
              10-yr Treasury
            </span>
          </div>
        </div>
        <div className="w-full min-w-0 flex-1 overflow-visible">
          <MetricChart metric={metric} compact={false} prominent />
        </div>
      </div>
      {metric.source ? (
        <p className="mt-3 text-[0.65rem] leading-snug text-stone-400">
          Source: {metric.source}
        </p>
      ) : null}
    </article>
  );
}
