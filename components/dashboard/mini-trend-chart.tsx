"use client";

import { useMemo } from "react";
import {
  Line,
  LineChart,
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

type MiniTrendChartProps = {
  data: ChartPoint[];
  format: ValueFormat;
  color?: string;
  prominent?: boolean;
};

export function MiniTrendChart({
  data,
  format,
  color = CHART.warmGray,
  prominent = false,
}: MiniTrendChartProps) {
  const mounted = useChartMounted();
  const labels = useMemo(() => data.map((d) => d.label), [data]);
  const values = useMemo(() => data.map((d) => d.value), [data]);
  const axes = useEditorialAxes(labels, values, format);

  return (
    <div className={`${chartHeightClass(prominent)} w-full min-w-0`}>
      {mounted ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={chartMargin(prominent)}>
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
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={prominent ? 2 : 1.75}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <ChartPlaceholder />
      )}
    </div>
  );
}
