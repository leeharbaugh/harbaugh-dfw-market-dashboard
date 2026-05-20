"use client";

import type { ValueFormat } from "@/lib/dfw-dashboard-sample-data";
import { formatTooltipValue } from "@/lib/format-metric";

type TooltipEntry = {
  value?: unknown;
  name?: string | number;
  color?: string;
};

type ChartTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: readonly TooltipEntry[];
  format: ValueFormat;
  formatSecondary?: ValueFormat;
};

function entryValue(entry: TooltipEntry): number {
  const raw = entry.value;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === "string") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function ChartTooltip({
  active,
  label,
  payload,
  format,
  formatSecondary,
}: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-[10px] border border-stone-200/90 bg-stone-50/95 px-2.5 py-2 text-xs text-stone-700 shadow-lg shadow-stone-900/[0.08]">
      <p className="mb-1 font-semibold text-stone-800">{label}</p>
      {payload.map((entry, i) => {
        const safe = entryValue(entry);
        const fmt = i === 1 && formatSecondary ? formatSecondary : format;
        return (
          <p
            key={entry.name ?? i}
            className="m-0 tabular-nums"
            style={{ color: entry.color ?? "#44403c" }}
          >
            {entry.name != null ? `${String(entry.name)}: ` : ""}
            {formatTooltipValue(safe, fmt)}
          </p>
        );
      })}
    </div>
  );
}
