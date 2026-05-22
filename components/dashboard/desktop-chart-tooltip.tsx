"use client";

import { ChartTooltip } from "@/components/dashboard/chart-tooltip";
import { useChartTouchActive } from "@/components/dashboard/chart-touch-context";
import type { ValueFormat } from "@/lib/dfw-dashboard-sample-data";

type TooltipEntry = {
  value?: unknown;
  name?: string | number;
  color?: string;
};

type DesktopChartTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: readonly TooltipEntry[];
  format: ValueFormat;
  formatSecondary?: ValueFormat;
};

/** Recharts tooltip content — suppressed while mobile touch tooltip is active. */
export function DesktopChartTooltip({
  active,
  label,
  payload,
  format,
  formatSecondary,
}: DesktopChartTooltipProps) {
  const touchActive = useChartTouchActive();
  if (touchActive) return null;
  return (
    <ChartTooltip
      active={active}
      label={label}
      payload={payload}
      format={format}
      formatSecondary={formatSecondary}
    />
  );
}
