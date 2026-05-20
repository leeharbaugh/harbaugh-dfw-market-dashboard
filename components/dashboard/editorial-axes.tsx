"use client";

import { useMemo } from "react";
import { CartesianGrid, XAxis, YAxis } from "recharts";
import type { ValueFormat } from "@/lib/dfw-dashboard-sample-data";
import {
  computeSparseYTicks,
  editorialYDomain,
  sparseYearTickLabels,
  yAxisWidth,
} from "@/lib/chart-axis-utils";
import { formatAxisCompact, formatXYearTick } from "@/lib/format-axis";

export const AXIS_TICK_STYLE = {
  fontSize: 9,
  fill: "#a8a29e",
  fontFamily: "inherit",
} as const;

const AXIS_LINE_STYLE = { stroke: "#e7e5e4", strokeWidth: 1 };

export type EditorialAxesConfig = {
  xTicks: string[];
  yTicks: number[];
  yDomain: [number, number];
  yWidth: number;
  formatY: (value: number) => string;
  formatX: (label: string) => string;
};

export function useEditorialAxes(
  labels: string[],
  values: number[],
  format: ValueFormat,
): EditorialAxesConfig {
  return useMemo(() => {
    const xTicks = sparseYearTickLabels(labels);
    const yTicks = computeSparseYTicks(values);
    return {
      xTicks,
      yTicks,
      yDomain: editorialYDomain(yTicks),
      yWidth: yAxisWidth(yTicks, format),
      formatY: (v: number) => formatAxisCompact(v, format),
      formatX: formatXYearTick,
    };
  }, [labels, values, format]);
}

type EditorialXAxisProps = {
  config: EditorialAxesConfig;
};

export function EditorialXAxis({ config }: EditorialXAxisProps) {
  return (
    <XAxis
      dataKey="label"
      ticks={config.xTicks}
      tickFormatter={config.formatX}
      tick={AXIS_TICK_STYLE}
      tickLine={false}
      axisLine={AXIS_LINE_STYLE}
      interval={0}
      minTickGap={24}
      height={20}
      dy={2}
    />
  );
}

type EditorialYAxisProps = {
  config: EditorialAxesConfig;
};

export function EditorialYAxis({ config }: EditorialYAxisProps) {
  return (
    <YAxis
      domain={config.yDomain}
      ticks={config.yTicks}
      tickFormatter={config.formatY}
      tick={AXIS_TICK_STYLE}
      tickLine={false}
      axisLine={false}
      width={config.yWidth}
    />
  );
}

export function EditorialGrid() {
  return (
    <CartesianGrid
      stroke="#e7e5e4"
      strokeOpacity={0.45}
      vertical={false}
      horizontal
    />
  );
}
