import type { ChartPoint } from "@/lib/dfw-dashboard-sample-data";
import type { FredObservation } from "@/lib/fred/types";
import type { FredValueTransform } from "@/lib/data/fred-series-map";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MONTH_NAMES_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function isoDateToChartLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return `${MONTH_NAMES[d.getUTCMonth()]} ’${String(d.getUTCFullYear()).slice(-2)}`;
}

export function isoDateToUpdatedThrough(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return `${MONTH_NAMES_FULL[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function applyScalarTransform(
  value: number,
  transform: FredValueTransform,
): number {
  switch (transform) {
    case "trillionsFromBillions":
      return value / 1000;
    case "trillionsFromMillions":
      return value / 1_000_000;
    case "none":
    default:
      return value;
  }
}

function computeYearOverYear(
  observations: FredObservation[],
  periodsBack: number,
): FredObservation[] {
  const sorted = [...observations].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const out: FredObservation[] = [];

  for (let i = periodsBack; i < sorted.length; i++) {
    const current = sorted[i];
    const prior = sorted[i - periodsBack];
    if (prior.value === 0) continue;
    const yoy = (current.value / prior.value - 1) * 100;
    out.push({ date: current.date, value: yoy });
  }

  return out;
}

export function transformFredObservations(
  observations: FredObservation[],
  transform: FredValueTransform,
): FredObservation[] {
  switch (transform) {
    case "cpiYearOverYear":
      return computeYearOverYear(observations, 12);
    case "gdpYearOverYear":
      return computeYearOverYear(observations, 4);
    case "trillionsFromBillions":
    case "trillionsFromMillions":
    case "none":
      return observations.map((o) => ({
        date: o.date,
        value: applyScalarTransform(o.value, transform),
      }));
    default:
      return observations;
  }
}

export function observationsToChartPoints(
  observations: FredObservation[],
): ChartPoint[] {
  return observations.map((o) => ({
    label: isoDateToChartLabel(o.date),
    value: o.value,
  }));
}

/** Align two series on calendar date for dual-line charts. */
export function alignDualSeries(
  primary: ChartPoint[],
  secondary: ChartPoint[],
): { primary: ChartPoint[]; secondary: ChartPoint[] } {
  const labelToSecondary = new Map(
    secondary.map((p) => [p.label, p.value] as const),
  );
  const labelToPrimary = new Map(
    primary.map((p) => [p.label, p.value] as const),
  );
  const labels = [
    ...new Set([...primary.map((p) => p.label), ...secondary.map((p) => p.label)]),
  ].sort((a, b) => {
    const da = chartLabelToTime(a);
    const db = chartLabelToTime(b);
    return da - db;
  });

  let lastPrimary = primary[0]?.value ?? 0;
  let lastSecondary = secondary[0]?.value ?? 0;

  const alignedPrimary: ChartPoint[] = [];
  const alignedSecondary: ChartPoint[] = [];

  for (const label of labels) {
    if (labelToPrimary.has(label)) {
      lastPrimary = labelToPrimary.get(label)!;
    }
    if (labelToSecondary.has(label)) {
      lastSecondary = labelToSecondary.get(label)!;
    }
    alignedPrimary.push({ label, value: lastPrimary });
    alignedSecondary.push({ label, value: lastSecondary });
  }

  return { primary: alignedPrimary, secondary: alignedSecondary };
}

function chartLabelToTime(label: string): number {
  const match = /^(\w+)\s+[''\u2019](\d{2})$/.exec(label.trim());
  if (!match) return 0;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const mi = months.indexOf(match[1]);
  const year = 2000 + Number.parseInt(match[2], 10);
  return year * 12 + (mi >= 0 ? mi : 0);
}
