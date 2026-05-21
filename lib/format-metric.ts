import type { ValueFormat } from "@/lib/dfw-dashboard-sample-data";

const usd0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const count0 = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export function formatMetricValue(value: number, format: ValueFormat): string {
  switch (format) {
    case "usd":
      return usd0.format(value);
    case "pct2":
      return `${value.toFixed(2)}%`;
    case "pct1":
      return `${value.toFixed(1)}%`;
    case "ratioMo":
      return `${value.toFixed(1)} mo`;
    case "count":
      return count0.format(value);
    case "idx":
      return value.toFixed(1);
    case "trillions": {
      const abs = Math.abs(value);
      const decimals = abs >= 10 ? 1 : abs >= 1 ? 2 : 2;
      return `$${value.toFixed(decimals).replace(/\.0$/, "")}T`;
    }
    case "income":
      return usd0.format(value);
    case "spread":
      return `${value >= 0 ? "+" : ""}${value.toFixed(2)} pp`;
    default:
      return String(value);
  }
}

export function formatTooltipValue(value: number, format: ValueFormat): string {
  return formatMetricValue(value, format);
}

export function pctChange(current: number, prior: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(prior) || prior === 0) {
    return null;
  }
  return (current / prior - 1) * 100;
}

export function formatDeltaPct(p: number | null): string {
  if (p == null || !Number.isFinite(p)) {
    return "—";
  }
  const text = `${p > 0 ? "+" : ""}${p.toFixed(1)}%`;
  return text.replace("-", "−");
}
