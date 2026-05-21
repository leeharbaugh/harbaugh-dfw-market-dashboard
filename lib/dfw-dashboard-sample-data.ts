import {
  annotateBundleFallback,
  type DashboardMetricDraft,
} from "@/lib/dashboard/metric-metadata";

export type ChartPoint = { label: string; value: number };

export type ChartKind = "line" | "bar" | "area" | "dual-line";

export type ValueFormat =
  | "usd"
  | "pct2"
  | "pct1"
  | "ratioMo"
  | "count"
  | "idx"
  | "trillions"
  | "income"
  | "spread";

export type MetricDataStatus = "live" | "fallback" | "error";

export type DashboardMetric = {
  title: string;
  subtitle?: string;
  points: ChartPoint[];
  pointsSecondary?: ChartPoint[];
  format: ValueFormat;
  formatSecondary?: ValueFormat;
  chartKind: ChartKind;
  color?: string;
  colorSecondary?: string;
  source?: string;
  /** Latest observation period (display). */
  updatedThrough?: string;
  /** ISO date of latest observation when known. */
  latestObservationDate?: string;
  dataStatus: MetricDataStatus;
  /** FRED series_id when this metric is FRED-backed. */
  fredSeriesId?: string;
  /** Short note when dataStatus is error (e.g. fetch failure). */
  statusNote?: string;
};

export type DashboardBundle = {
  dfw: DashboardMetric[];
  arlington: DashboardMetric[];
  mansfield: DashboardMetric[];
  national: DashboardMetric[];
  regional: DashboardMetric[];
};

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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

function formatUpdatedThrough(label: string): string {
  const match = /^(\w+)\s+'(\d{2})$/.exec(label);
  if (!match) return label;
  const monthIdx = MONTH_NAMES.indexOf(match[1]);
  const month =
    monthIdx >= 0 ? MONTH_NAMES_FULL[monthIdx] : match[1];
  const year = 2000 + Number.parseInt(match[2], 10);
  return `${month} ${year}`;
}

function monthLabels(
  startYear: number,
  startMonth0: number,
  count: number,
): string[] {
  const out: string[] = [];
  let y = startYear;
  let m = startMonth0;
  for (let i = 0; i < count; i++) {
    out.push(`${MONTH_NAMES[m]} ’${String(y).slice(-2)}`);
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }
  return out;
}

function walk(
  rand: () => number,
  n: number,
  start: number,
  drift: number,
  vol: number,
  min: number,
  max: number,
): number[] {
  const vals: number[] = [];
  let v = start;
  for (let i = 0; i < n; i++) {
    v += drift + (rand() - 0.5) * vol;
    v = Math.max(min, Math.min(max, v));
    vals.push(v);
  }
  return vals;
}

function asSeries(labels: string[], values: number[]): ChartPoint[] {
  return labels.map((label, i) => ({
    label,
    value: values[i] ?? values[values.length - 1],
  }));
}

export function buildDashboardMetrics(seed: number): DashboardBundle {
  const rand = mulberry32(seed ^ 0x9e3779b9);
  const labels = monthLabels(2021, 4, 60);
  const n = 60;

  const medianPrice = walk(rand, n, 318_000, 280, 9_200, 255_000, 498_000);
  const monthsSupply = walk(rand, n, 2.15, 0.0015, 0.11, 1.25, 4.35);
  const salesVolume = walk(rand, n, 8_050, -10, 520, 4_100, 11_400);
  const csDfw = walk(rand, n, 198.4, 0.14, 0.55, 178, 228);

  const arlPrice = walk(rand, n, 302_000, 230, 7_600, 232_000, 438_000);
  const arlSupply = walk(rand, n, 1.95, 0.0012, 0.09, 1.1, 3.8);

  const mansPrice = walk(rand, n, 345_000, 300, 8_000, 272_000, 482_000);
  const mansSupply = walk(rand, n, 2.05, 0.0013, 0.1, 1.15, 3.9);

  const mortgage30 = walk(rand, n, 6.45, 0.012, 0.18, 2.82, 7.95);
  const treasury10 = walk(rand, n, 4.15, 0.009, 0.14, 1.45, 4.85);
  const fed = walk(rand, n, 4.85, 0.0075, 0.055, 0, 5.45);
  const cpiUs = walk(rand, n, 3.15, 0.014, 0.32, 1.15, 8.6);
  const nationalDebt = walk(rand, n, 34.2, 0.018, 0.08, 28.5, 36.8);
  const gdpUs = walk(rand, n, 2.65, 0.008, 0.38, 0.85, 4.2);
  const usUnemp = walk(rand, n, 4.15, -0.007, 0.11, 3.45, 7.85);
  const householdIncome = walk(rand, n, 78_500, 42, 420, 72_000, 84_500);
  const csNational = walk(rand, n, 312.8, 0.18, 0.62, 268, 348);
  const m2Supply = walk(rand, n, 21.15, 0.025, 0.12, 19.5, 22.8);

  const txUnemp = walk(rand, n, 3.95, -0.0035, 0.12, 3.35, 5.65);
  const lastLabel = labels[labels.length - 1] ?? "";
  const updatedThrough = formatUpdatedThrough(lastLabel);
  const cpiDfw = walk(rand, n, 3.35, 0.015, 0.34, 1.25, 8.2);
  const gdpTx = walk(rand, n, 2.85, 0.009, 0.4, 0.95, 4.65);

  const bundle = {
    dfw: [
      {
        title: "Median Home Price — DFW",
        subtitle: "Metro median closed sale price",
        points: asSeries(labels, medianPrice),
        format: "usd",
        chartKind: "line",
        color: "#1e3a5f",
        source: "TRERC",
      },
      {
        title: "Months Supply — DFW",
        subtitle: "Active listings ÷ sales pace",
        points: asSeries(labels, monthsSupply),
        format: "ratioMo",
        chartKind: "bar",
        color: "#5b7c99",
        source: "TRERC",
      },
      {
        title: "Sales Volume — DFW",
        subtitle: "Monthly closed sales, units",
        points: asSeries(labels, salesVolume),
        format: "count",
        chartKind: "bar",
        color: "#44403c",
        source: "TRERC",
      },
      {
        title: "Case-Shiller Home Price Index — DFW",
        subtitle: "Jan 2000 = 100, sample series",
        points: asSeries(labels, csDfw),
        format: "idx",
        chartKind: "line",
        color: "#b8aa7a",
        source: "S&P CoreLogic Case-Shiller / FRED",
      },
    ],
    arlington: [
      {
        title: "Arlington Median Home Price",
        subtitle: "City of Arlington",
        points: asSeries(labels, arlPrice),
        format: "usd",
        chartKind: "line",
        color: "#1e3a5f",
        source: "TRERC",
      },
      {
        title: "Arlington Months Supply",
        subtitle: "Months of inventory",
        points: asSeries(labels, arlSupply),
        format: "ratioMo",
        chartKind: "bar",
        color: "#5b7c99",
        source: "TRERC",
      },
    ],
    mansfield: [
      {
        title: "Mansfield Median Home Price",
        subtitle: "City of Mansfield",
        points: asSeries(labels, mansPrice),
        format: "usd",
        chartKind: "line",
        color: "#1e3a5f",
        source: "TRERC",
      },
      {
        title: "Mansfield Months Supply",
        subtitle: "Months of inventory",
        points: asSeries(labels, mansSupply),
        format: "ratioMo",
        chartKind: "bar",
        color: "#5b7c99",
        source: "TRERC",
      },
    ],
    national: [
      {
        title: "30-Year Mortgage Rate vs 10-Year Treasury Yield",
        subtitle: "Primary market mortgage vs benchmark yield; spread shown at latest",
        points: asSeries(labels, mortgage30),
        pointsSecondary: asSeries(labels, treasury10),
        format: "pct2",
        formatSecondary: "pct2",
        chartKind: "dual-line",
        color: "#1e3a5f",
        colorSecondary: "#b8aa7a",
        source: "Freddie Mac / FRED",
      },
      {
        title: "M2 Money Supply — U.S.",
        subtitle: "Broad money stock",
        points: asSeries(labels, m2Supply),
        format: "trillions",
        chartKind: "line",
        color: "#78716c",
        source: "FRED",
        updatedThrough,
      },
      {
        title: "Federal Funds Target Rate",
        subtitle: "Effective federal funds rate",
        points: asSeries(labels, fed),
        format: "pct2",
        chartKind: "line",
        color: "#44403c",
        source: "FRED",
      },
      {
        title: "CPI Inflation — U.S.",
        subtitle: "Headline CPI, year-over-year",
        points: asSeries(labels, cpiUs),
        format: "pct2",
        chartKind: "area",
        color: "#5b7c99",
        source: "FRED",
      },
      {
        title: "U.S. National Debt",
        subtitle: "Total public debt outstanding",
        points: asSeries(labels, nationalDebt),
        format: "trillions",
        chartKind: "line",
        color: "#78716c",
        source: "FRED",
      },
      {
        title: "Real GDP — U.S.",
        subtitle: "Real GDP growth, year-over-year",
        points: asSeries(labels, gdpUs),
        format: "pct2",
        chartKind: "line",
        color: "#1e3a5f",
        source: "FRED",
      },
      {
        title: "Unemployment Rate — U.S.",
        subtitle: "Seasonally adjusted",
        points: asSeries(labels, usUnemp),
        format: "pct2",
        chartKind: "area",
        color: "#5b7c99",
        source: "FRED",
      },
      {
        title: "Household Income — U.S.",
        subtitle: "Median household income, nominal",
        points: asSeries(labels, householdIncome),
        format: "income",
        chartKind: "line",
        color: "#b8aa7a",
        source: "FRED",
      },
      {
        title: "Case-Shiller Home Price Index — U.S. National",
        subtitle: "Jan 2000 = 100, sample series",
        points: asSeries(labels, csNational),
        format: "idx",
        chartKind: "line",
        color: "#1e3a5f",
        source: "S&P CoreLogic Case-Shiller / FRED",
      },
    ],
    regional: [
      {
        title: "Unemployment Rate — Texas",
        subtitle: "Statewide, seasonally adjusted",
        points: asSeries(labels, txUnemp),
        format: "pct2",
        chartKind: "area",
        color: "#5b7c99",
        source: "FRED",
      },
      {
        title: "CPI Inflation — DFW",
        subtitle: "Metro CPI, year-over-year",
        points: asSeries(labels, cpiDfw),
        format: "pct2",
        chartKind: "area",
        color: "#5b7c99",
        source: "FRED",
      },
      {
        title: "Real GDP — Texas",
        subtitle: "State real GDP growth, year-over-year",
        points: asSeries(labels, gdpTx),
        format: "pct2",
        chartKind: "line",
        color: "#1e3a5f",
        source: "FRED",
      },
    ],
  };

  return {
    dfw: annotateBundleFallback(bundle.dfw as DashboardMetricDraft[]),
    arlington: annotateBundleFallback(
      bundle.arlington as DashboardMetricDraft[],
    ),
    mansfield: annotateBundleFallback(
      bundle.mansfield as DashboardMetricDraft[],
    ),
    national: annotateBundleFallback(
      bundle.national as DashboardMetricDraft[],
    ),
    regional: annotateBundleFallback(
      bundle.regional as DashboardMetricDraft[],
    ),
  };
}
