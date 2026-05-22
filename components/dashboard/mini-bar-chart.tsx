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
import { DesktopChartTooltip } from "@/components/dashboard/desktop-chart-tooltip";
import {
  EditorialGrid,
  EditorialXAxis,
  EditorialYAxis,
  useEditorialAxes,
} from "@/components/dashboard/editorial-axes";
import { useChartTouchActive } from "@/components/dashboard/chart-touch-context";
import {
  CHART_AXIS_TOOLTIP,
  ChartTouchWrapper,
} from "@/components/dashboard/chart-touch-wrapper";
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

function MiniBarChartPlot({
  data,
  format,
  color,
  prominent,
  mounted,
}: MiniBarChartProps & { mounted: boolean }) {
  const labels = useMemo(() => data.map((d) => d.label), [data]);
  const values = useMemo(() => data.map((d) => d.value), [data]);
  const axes = useEditorialAxes(labels, values, format);
  const margin = chartMargin(prominent);
  const touchActive = useChartTouchActive();

  if (!mounted) {
    return <ChartPlaceholder />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={margin}>
        <EditorialGrid />
        <EditorialXAxis config={axes} />
        <EditorialYAxis config={axes} />
        <Tooltip
          {...CHART_AXIS_TOOLTIP}
          cursor={
            touchActive ? false : { fill: "rgba(120, 113, 108, 0.08)" }
          }
          content={({ active, label, payload }) => (
            <DesktopChartTooltip
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
  );
}

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
  const margin = chartMargin(prominent);

  return (
    <ChartTouchWrapper
      className={chartHeightClass(prominent)}
      tooltip={{
        labels,
        format,
        margin,
        yAxisWidth: axes.yWidth,
        getEntries: (index) => [
          { value: data[index]?.value ?? 0, color },
        ],
      }}
    >
      <MiniBarChartPlot
        data={data}
        format={format}
        color={color}
        prominent={prominent}
        mounted={mounted}
      />
    </ChartTouchWrapper>
  );
}
