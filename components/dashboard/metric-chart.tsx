"use client";

import type { DashboardMetric } from "@/lib/dfw-dashboard-sample-data";
import { CHART } from "@/lib/chart-palette";
import { DualLineSpreadChart } from "@/components/dashboard/dual-line-spread-chart";
import { MiniAreaChart } from "@/components/dashboard/mini-area-chart";
import { MiniBarChart } from "@/components/dashboard/mini-bar-chart";
import { MiniTrendChart } from "@/components/dashboard/mini-trend-chart";

type MetricChartProps = {
  metric: DashboardMetric;
  compact?: boolean;
  prominent?: boolean;
};

export function MetricChart({
  metric,
  compact = true,
  prominent = false,
}: MetricChartProps) {
  const color = metric.color ?? CHART.warmGray;

  switch (metric.chartKind) {
    case "bar":
      return (
        <MiniBarChart
          data={metric.points}
          format={metric.format}
          color={color}
          prominent={prominent}
        />
      );
    case "area":
      return (
        <MiniAreaChart
          data={metric.points}
          format={metric.format}
          color={color}
          prominent={prominent}
        />
      );
    case "dual-line":
      if (!metric.pointsSecondary?.length) {
        return (
          <MiniTrendChart
            data={metric.points}
            format={metric.format}
            color={color}
            prominent={prominent}
          />
        );
      }
      return (
        <DualLineSpreadChart
          primary={metric.points}
          secondary={metric.pointsSecondary}
          format={metric.format}
          formatSecondary={metric.formatSecondary}
          colorPrimary={metric.color ?? CHART.navy}
          colorSecondary={metric.colorSecondary ?? CHART.mutedGold}
          compact={compact}
          prominent={prominent}
        />
      );
    case "line":
    default:
      return (
        <MiniTrendChart
          data={metric.points}
          format={metric.format}
          color={color}
          prominent={prominent}
        />
      );
  }
}
