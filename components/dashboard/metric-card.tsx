"use client";

import type { DashboardMetric } from "@/lib/dfw-dashboard-sample-data";
import {
  formatDeltaPct,
  formatMetricValue,
  pctChange,
} from "@/lib/format-metric";
import { MetricChart } from "@/components/dashboard/metric-chart";

type MetricCardProps = {
  metric: DashboardMetric;
};

export function MetricCard({ metric }: MetricCardProps) {
  const pts = metric.points;
  const last = pts[pts.length - 1]?.value ?? 0;
  const prev1 = pts[pts.length - 2]?.value;
  const prev3 = pts[pts.length - 4]?.value;
  const prev12 = pts[pts.length - 13]?.value;

  const mom = pctChange(last, prev1 ?? last);
  const three = pctChange(last, prev3 ?? last);
  const yoy = pctChange(last, prev12 ?? last);

  return (
    <article className="group flex flex-col rounded-2xl border border-stone-200/80 bg-white/70 p-3.5 shadow-sm shadow-stone-900/[0.04] ring-1 ring-stone-900/[0.02] backdrop-blur-sm transition-shadow hover:shadow-md hover:shadow-stone-900/[0.06] sm:p-4">
      <div className="min-w-0">
        <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-stone-500">
          {metric.title}
        </h3>
        {metric.subtitle ? (
          <p className="mt-0.5 text-xs leading-snug text-stone-400">
            {metric.subtitle}
          </p>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <p className="font-sans text-xl font-semibold tracking-tight text-stone-900 tabular-nums sm:text-2xl">
          {formatMetricValue(last, metric.format)}
        </p>
        <dl className="flex flex-wrap gap-x-3 gap-y-1 text-[0.7rem] text-stone-500 tabular-nums">
          <div className="flex items-baseline gap-1.5">
            <dt className="font-medium text-stone-400">MoM</dt>
            <dd className="text-stone-700">{formatDeltaPct(mom)}</dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="font-medium text-stone-400">3-mo</dt>
            <dd className="text-stone-700">{formatDeltaPct(three)}</dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="font-medium text-stone-400">YoY</dt>
            <dd className="text-stone-700">{formatDeltaPct(yoy)}</dd>
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
