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
  CHART_LINE_ACTIVE_DOT,
  ChartTouchWrapper,
} from "@/components/dashboard/chart-touch-wrapper";
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

function MiniTrendChartPlot({
  data,
  format,
  color,
  prominent,
  mounted,
}: MiniTrendChartProps & { mounted: boolean }) {
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
      <LineChart data={data} margin={margin}>
        <EditorialGrid />
        <EditorialXAxis config={axes} />
        <EditorialYAxis config={axes} />
        <Tooltip
          {...CHART_AXIS_TOOLTIP}
          cursor={touchActive ? false : { stroke: "#d6d3d1", strokeWidth: 1 }}
          content={({ active, label, payload }) => (
            <DesktopChartTooltip
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
          activeDot={CHART_LINE_ACTIVE_DOT}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function MiniTrendChart({
  data,
  format,
  color = CHART.warmGray,
  prominent = false,
}: MiniTrendChartProps) {
  const mounted = useChartMounted();
  const labels = useMemo(() => data.map((d) => d.label), [data]);
  const margin = chartMargin(prominent);
  const values = useMemo(() => data.map((d) => d.value), [data]);
  const axes = useEditorialAxes(labels, values, format);

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
      <MiniTrendChartPlot
        data={data}
        format={format}
        color={color}
        prominent={prominent}
        mounted={mounted}
      />
    </ChartTouchWrapper>
  );
}
