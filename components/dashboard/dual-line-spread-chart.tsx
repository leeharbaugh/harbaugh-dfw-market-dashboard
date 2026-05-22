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
import { ChartWrapper } from "@/components/dashboard/chart-wrapper";
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
    <ChartWrapper className={height}>
      {mounted ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={merged} margin={margin}>
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
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="treasury"
              name="10-yr Treasury"
              stroke={colorSecondary}
              strokeWidth={compact ? 1.75 : 2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <ChartPlaceholder />
      )}
    </ChartWrapper>
  );
}
