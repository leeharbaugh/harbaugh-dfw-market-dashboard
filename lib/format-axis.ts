import type { ValueFormat } from "@/lib/dfw-dashboard-sample-data";

function compactUsd(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (abs >= 1_000_000) {
    const m = abs / 1_000_000;
    const text = m >= 10 ? m.toFixed(0) : m.toFixed(1);
    return `${sign}$${text.replace(/\.0$/, "")}M`;
  }
  if (abs >= 1_000) {
    const k = abs / 1_000;
    const text = k >= 100 ? k.toFixed(0) : k >= 10 ? k.toFixed(0) : k.toFixed(1);
    return `${sign}$${text.replace(/\.0$/, "")}k`;
  }
  return `${sign}$${abs.toFixed(0)}`;
}

/** Compact axis labels: $400k, 5%, 21T, 8k, etc. */
export function formatAxisCompact(value: number, format: ValueFormat): string {
  if (!Number.isFinite(value)) return "";

  switch (format) {
    case "usd":
    case "income":
      return compactUsd(value);
    case "pct2":
    case "pct1": {
      const decimals = Math.abs(value) < 10 ? 1 : 0;
      return `${value.toFixed(decimals).replace(/\.0$/, "")}%`;
    }
    case "trillions": {
      const abs = Math.abs(value);
      const sign = value < 0 ? "−" : "";
      const text =
        abs >= 10 ? abs.toFixed(0) : abs >= 1 ? abs.toFixed(1) : abs.toFixed(2);
      return `${sign}$${text.replace(/\.0$/, "")}T`;
    }
    case "count": {
      const abs = Math.abs(value);
      const sign = value < 0 ? "−" : "";
      if (abs >= 1_000_000) {
        return `${sign}${(abs / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
      }
      if (abs >= 1_000) {
        return `${sign}${(abs / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
      }
      return `${sign}${abs.toFixed(0)}`;
    }
    case "ratioMo":
      return `${value.toFixed(1).replace(/\.0$/, "")}`;
    case "idx":
      return value >= 100 ? value.toFixed(0) : value.toFixed(1);
    case "spread":
      return `${value.toFixed(1)}`;
    default:
      return String(Math.round(value * 10) / 10);
  }
}

export function parseLabelYear(label: string): number | null {
  const match = /[''\u2019](\d{2})$/.exec(label.trim());
  if (!match) return null;
  return 2000 + Number.parseInt(match[1], 10);
}

/** X-axis tick: show year only (2020, 2022, 2024). */
export function formatXYearTick(label: string): string {
  const year = parseLabelYear(label);
  return year != null ? String(year) : label;
}
