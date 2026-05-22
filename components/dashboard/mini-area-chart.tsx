"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ChartPoint, ValueFormat } from "@/lib/dfw-dashboard-sample-data";
import { CHART } from "@/lib/chart-palette";
import { chartHeightClass, chartMargin } from "@/lib/chart-layout";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";
import {
  EditorialGrid,
  EditorialXAxis,
  EditorialYAxis,
  useEditorialAxes,
} from "@/components/dashboard/editorial-axes";
import {
  ChartPlaceholder,
  useChartMounted,
} from "@/components/dashboard/use-chart-mounted";

type MiniAreaChartProps = {
  data: ChartPoint[];
  format: ValueFormat;
  color?: string;
  prominent?: boolean;
};

export function MiniAreaChart({
  data,
  format,
  color = CHART.mutedBlue,
  prominent = false,
}: MiniAreaChartProps) {
  const mounted = useChartMounted();
  const fillId = `area-${color.replace("#", "")}`;
  const labels = useMemo(() => data.map((d) => d.label), [data]);
  const values = useMemo(() => data.map((d) => d.value), [data]);
  const axes = useEditorialAxes(labels, values, format);

  return (
    <div className={`${chartHeightClass(prominent)} w-full min-w-0`}>
      {mounted ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={chartMargin(prominent)}>
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={color} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <EditorialGrid />
            <EditorialXAxis config={axes} />
            <EditorialYAxis config={axes} />
            <Tooltip
              cursor={{ stroke: "#d6d3d1", strokeWidth: 1 }}
              content={({ active, label, payload }) => (
                <ChartTooltip
                  active={active}
                  label={label}
                  payload={payload}
                  format={format}
                />
              )}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={prominent ? 2 : 1.5}
              fill={`url(#${fillId})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <ChartPlaceholder />
      )}
    </div>
  );
}
