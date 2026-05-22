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

type DualLineSpreadChartProps = {
  primary: ChartPoint[];
  secondary: ChartPoint[];
  format: ValueFormat;
  formatSecondary?: ValueFormat;
  colorPrimary?: string;
  colorSecondary?: string;
  compact?: boolean;
  prominent?: boolean;
};

type MergedPoint = {
  label: string;
  mortgage: number;
  treasury: number;
};

function DualLineSpreadChartPlot({
  merged,
  format,
  formatSecondary,
  colorPrimary,
  colorSecondary,
  compact,
  prominent,
  margin,
  mounted,
}: {
  merged: MergedPoint[];
  format: ValueFormat;
  formatSecondary: ValueFormat;
  colorPrimary: string;
  colorSecondary: string;
  compact: boolean;
  prominent: boolean;
  margin: { top: number; right: number; left: number; bottom: number };
  mounted: boolean;
}) {
  const labels = useMemo(() => merged.map((d) => d.label), [merged]);
  const values = useMemo(
    () => merged.flatMap((d) => [d.mortgage, d.treasury]),
    [merged],
  );
  const axes = useEditorialAxes(labels, values, format);
  const touchActive = useChartTouchActive();

  if (!mounted) {
    return <ChartPlaceholder />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={merged} margin={margin}>
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
              formatSecondary={formatSecondary}
            />
          )}
        />
        <Line
          type="monotone"
          dataKey="mortgage"
          name="30-yr mortgage"
          stroke={colorPrimary}
          strokeWidth={compact ? 1.75 : 2}
          dot={false}
          activeDot={CHART_LINE_ACTIVE_DOT}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="treasury"
          name="10-yr Treasury"
          stroke={colorSecondary}
          strokeWidth={compact ? 1.75 : 2}
          dot={false}
          activeDot={CHART_LINE_ACTIVE_DOT}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DualLineSpreadChart({
  primary,
  secondary,
  format,
  formatSecondary = format,
  colorPrimary = CHART.navy,
  colorSecondary = CHART.mutedGold,
  compact = false,
  prominent = false,
}: DualLineSpreadChartProps) {
  const mounted = useChartMounted();

  const merged = useMemo(
    () =>
      primary.map((p, i) => ({
        label: p.label,
        mortgage: p.value,
        treasury:
          secondary[i]?.value ??
          secondary[secondary.length - 1]?.value ??
          0,
      })),
    [primary, secondary],
  );

  const labels = useMemo(() => merged.map((d) => d.label), [merged]);
  const values = useMemo(
    () => merged.flatMap((d) => [d.mortgage, d.treasury]),
    [merged],
  );
  const axes = useEditorialAxes(labels, values, format);

  const height = prominent
    ? chartHeightClass(true)
    : compact
      ? chartHeightClass(false)
      : "h-[7.5rem] sm:h-[8.5rem]";

  const margin = prominent
    ? chartMargin(true)
    : compact
      ? chartMargin(false)
      : { top: 6, right: 8, left: 2, bottom: 0 };

  return (
    <ChartTouchWrapper
      className={height}
      tooltip={{
        labels,
        format,
        formatSecondary,
        margin,
        yAxisWidth: axes.yWidth,
        getEntries: (index) => [
          {
            name: "30-yr mortgage",
            value: merged[index]?.mortgage ?? 0,
            color: colorPrimary,
          },
          {
            name: "10-yr Treasury",
            value: merged[index]?.treasury ?? 0,
            color: colorSecondary,
          },
        ],
      }}
    >
      <DualLineSpreadChartPlot
        merged={merged}
        format={format}
        formatSecondary={formatSecondary}
        colorPrimary={colorPrimary}
        colorSecondary={colorSecondary}
        compact={compact}
        prominent={prominent}
        margin={margin}
        mounted={mounted}
      />
    </ChartTouchWrapper>
  );
}
