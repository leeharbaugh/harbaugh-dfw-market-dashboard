import { formatAxisCompact, parseLabelYear } from "@/lib/format-axis";
import type { ValueFormat } from "@/lib/dfw-dashboard-sample-data";

const MAX_Y_TICKS = 4;
const MAX_YEAR_TICKS = 4;

/** Pick ~3–4 year labels spread across the series (e.g. 2020, 2022, 2024). */
export function sparseYearTickLabels(labels: string[]): string[] {
  if (labels.length === 0) return [];

  const byYear = new Map<number, string>();
  for (const label of labels) {
    const year = parseLabelYear(label);
    if (year == null) continue;
    const existing = byYear.get(year);
    const isJan = /^Jan\b/.test(label);
    if (!existing || isJan) {
      byYear.set(year, label);
    }
  }

  const years = [...byYear.keys()].sort((a, b) => a - b);
  if (years.length <= MAX_YEAR_TICKS) {
    return years.map((y) => byYear.get(y)!);
  }

  const min = years[0];
  const max = years[years.length - 1];
  const span = max - min;
  const step = span <= 3 ? 1 : span <= 6 ? 2 : Math.max(2, Math.round(span / (MAX_YEAR_TICKS - 1)));

  const pickedYears: number[] = [];
  for (let y = min; y <= max; y += step) {
    pickedYears.push(y);
  }
  if (pickedYears[pickedYears.length - 1] !== max) {
    pickedYears.push(max);
  }

  const unique = [...new Set(pickedYears)].slice(0, MAX_YEAR_TICKS);
  return unique.map((y) => byYear.get(y) ?? labels[0]);
}

export function computeSparseYTicks(values: number[]): number[] {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return [0];

  let min = Math.min(...finite);
  let max = Math.max(...finite);

  if (min === max) {
    const pad = Math.abs(max) * 0.12 || 1;
    min -= pad;
    max += pad;
  } else {
    const pad = (max - min) * 0.06;
    min -= pad;
    max += pad;
  }

  const range = max - min;
  const rough = range / (MAX_Y_TICKS - 1);
  const magnitude = 10 ** Math.floor(Math.log10(rough || 1));
  const normalized = rough / magnitude;

  let step = magnitude;
  if (normalized <= 1.5) step = magnitude;
  else if (normalized <= 3.5) step = 2 * magnitude;
  else if (normalized <= 7.5) step = 5 * magnitude;
  else step = 10 * magnitude;

  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let t = start; t <= max + step * 0.001; t += step) {
    ticks.push(Number(t.toPrecision(12)));
    if (ticks.length > MAX_Y_TICKS + 2) break;
  }

  if (ticks.length < 2) {
    return [min, max].map((v) => Number(v.toPrecision(12)));
  }

  if (ticks.length > MAX_Y_TICKS) {
    const stride = Math.ceil((ticks.length - 1) / (MAX_Y_TICKS - 1));
    const sparse = ticks.filter(
      (_, i) => i === 0 || i === ticks.length - 1 || i % stride === 0,
    );
    return sparse.slice(0, MAX_Y_TICKS);
  }

  return ticks;
}

/** Approximate Y-axis width from longest formatted tick. */
export function yAxisWidth(
  ticks: number[],
  format: ValueFormat,
): number {
  const longest = ticks.reduce((max, v) => {
    const len = formatAxisCompact(v, format).length;
    return len > max ? len : max;
  }, 4);
  return Math.min(48, Math.max(30, longest * 6.5 + 8));
}

export function editorialYDomain(ticks: number[]): [number, number] {
  return [ticks[0], ticks[ticks.length - 1]];
}
