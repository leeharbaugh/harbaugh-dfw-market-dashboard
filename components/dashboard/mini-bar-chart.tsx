"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
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
import { ChartWrapper } from "@/components/dashboard/chart-wrapper";
import {
  ChartPlaceholder,
  useChartMounted,
} from "@/components/dashboard/use-chart-mounted";

type MiniBarChartProps = {
  data: ChartPoint[];
  format: ValueFormat;
  color?: string;
  prominent?: boolean;
};

export function MiniBarChart({
  data,
  format,
  color = CHART.charcoal,
  prominent = false,
}: MiniBarChartProps) {
  const mounted = useChartMounted();
  const labels = useMemo(() => data.map((d) => d.label), [data]);
  const values = useMemo(() => data.map((d) => d.value), [data]);
  const axes = useEditorialAxes(labels, values, format);

  return (
    <ChartWrapper className={chartHeightClass(prominent)}>
      {mounted ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={chartMargin(prominent)}>
            <EditorialGrid />
            <EditorialXAxis config={axes} />
            <EditorialYAxis config={axes} />
            <Tooltip
              cursor={{ fill: "rgba(120, 113, 108, 0.08)" }}
              content={({ active, label, payload }) => (
                <ChartTooltip
                  active={active}
                  label={label}
                  payload={payload}
                  format={format}
                />
              )}
            />
            <Bar
              dataKey="value"
              fill={color}
              fillOpacity={0.72}
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ChartPlaceholder />
      )}
    </ChartWrapper>
  );
}
