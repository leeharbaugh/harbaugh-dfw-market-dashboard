"use client";

import { formatTooltipValue } from "@/lib/format-metric";
import type { ValueFormat } from "@/lib/dfw-dashboard-sample-data";
export type MobileTooltipEntry = {
  name?: string;
  value: number;
  color?: string;
};

type MobileChartTooltipProps = {
  label: string;
  entries: MobileTooltipEntry[];
  format: ValueFormat;
  formatSecondary?: ValueFormat;
};

/** Touch-driven tooltip — explicit styles so it is never clipped or transparent. */
export function MobileChartTooltip({
  label,
  entries,
  format,
  formatSecondary,
}: MobileChartTooltipProps) {
  return (
    <div className="rounded-[10px] border border-stone-300 bg-white px-2.5 py-2 text-xs text-stone-900 shadow-lg shadow-stone-900/15">
      <p className="mb-1 font-semibold text-stone-900">{label}</p>
      {entries.map((entry, i) => {
        const fmt = i === 1 && formatSecondary ? formatSecondary : format;
        const namePrefix =
          entry.name != null ? `${String(entry.name)}: ` : "";
        return (
          <p
            key={entry.name ?? i}
            className="m-0 tabular-nums text-stone-800"
            style={{ color: entry.color ?? "#292524" }}
          >
            {namePrefix}
            {formatTooltipValue(entry.value, fmt)}
          </p>
        );
      })}
    </div>
  );
}
