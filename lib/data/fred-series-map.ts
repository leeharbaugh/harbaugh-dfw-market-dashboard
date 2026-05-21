/**
 * Central registry of FRED series used by the dashboard.
 * TRERC and other non-FRED sources are added in later phases.
 */

export const FRED_OBSERVATION_START = "2021-05-01";

/** Stable keys for wiring live data into dashboard metrics. */
export const DashboardMetricKey = {
  MORTGAGE_VS_TREASURY: "mortgage_vs_treasury",
  MORTGAGE_30Y: "mortgage_30y",
  TREASURY_10Y: "treasury_10y",
  M2: "m2",
  FED_FUNDS: "fed_funds",
  CPI_US: "cpi_us",
  NATIONAL_DEBT: "national_debt",
  GDP_US: "gdp_us",
  UNEMPLOYMENT_US: "unemployment_us",
} as const;

export type DashboardMetricKey =
  (typeof DashboardMetricKey)[keyof typeof DashboardMetricKey];

export type FredValueTransform =
  | "none"
  | "trillionsFromBillions"
  | "trillionsFromMillions"
  | "cpiYearOverYear"
  | "gdpYearOverYear";

export type FredSeriesDefinition = {
  /** Internal registry id */
  id: string;
  /** FRED series_id */
  seriesId: string;
  observationStart: string;
  transform: FredValueTransform;
  /** Dashboard metrics this series feeds */
  metricKeys: DashboardMetricKey[];
  description: string;
};

export const FRED_DASHBOARD_SERIES: readonly FredSeriesDefinition[] = [
  {
    id: "treasury_10y",
    seriesId: "DGS10",
    observationStart: FRED_OBSERVATION_START,
    transform: "none",
    metricKeys: [DashboardMetricKey.TREASURY_10Y],
    description: "10-Year Treasury Constant Maturity Rate",
  },
  {
    id: "mortgage_30y",
    seriesId: "MORTGAGE30US",
    observationStart: FRED_OBSERVATION_START,
    transform: "none",
    metricKeys: [DashboardMetricKey.MORTGAGE_30Y],
    description: "30-Year Fixed Rate Mortgage Average",
  },
  {
    id: "m2",
    seriesId: "M2SL",
    observationStart: FRED_OBSERVATION_START,
    transform: "trillionsFromBillions",
    metricKeys: [DashboardMetricKey.M2],
    description: "M2 Money Stock",
  },
  {
    id: "unemployment_us",
    seriesId: "UNRATE",
    observationStart: FRED_OBSERVATION_START,
    transform: "none",
    metricKeys: [DashboardMetricKey.UNEMPLOYMENT_US],
    description: "Unemployment Rate",
  },
  {
    id: "cpi_us",
    seriesId: "CPIAUCSL",
    observationStart: FRED_OBSERVATION_START,
    transform: "cpiYearOverYear",
    metricKeys: [DashboardMetricKey.CPI_US],
    description: "CPI All Urban Consumers (YoY % derived)",
  },
  {
    id: "gdp_us",
    seriesId: "GDPC1",
    observationStart: FRED_OBSERVATION_START,
    transform: "gdpYearOverYear",
    metricKeys: [DashboardMetricKey.GDP_US],
    description: "Real GDP (YoY % derived)",
  },
  {
    id: "fed_funds",
    seriesId: "FEDFUNDS",
    observationStart: FRED_OBSERVATION_START,
    transform: "none",
    metricKeys: [DashboardMetricKey.FED_FUNDS],
    description: "Federal Funds Effective Rate",
  },
  {
    id: "national_debt",
    seriesId: "GFDEBTN",
    observationStart: FRED_OBSERVATION_START,
    transform: "trillionsFromMillions",
    metricKeys: [DashboardMetricKey.NATIONAL_DEBT],
    description: "Federal Debt: Total Public Debt",
  },
] as const;

/** Maps dashboard metric keys to national section metric titles. */
export const METRIC_KEY_TO_TITLE: Record<DashboardMetricKey, string> = {
  [DashboardMetricKey.MORTGAGE_VS_TREASURY]:
    "30-Year Mortgage Rate vs 10-Year Treasury Yield",
  [DashboardMetricKey.MORTGAGE_30Y]:
    "30-Year Mortgage Rate vs 10-Year Treasury Yield",
  [DashboardMetricKey.TREASURY_10Y]:
    "30-Year Mortgage Rate vs 10-Year Treasury Yield",
  [DashboardMetricKey.M2]: "M2 Money Supply — U.S.",
  [DashboardMetricKey.FED_FUNDS]: "Federal Funds Target Rate",
  [DashboardMetricKey.CPI_US]: "CPI Inflation — U.S.",
  [DashboardMetricKey.NATIONAL_DEBT]: "U.S. National Debt",
  [DashboardMetricKey.GDP_US]: "Real GDP — U.S.",
  [DashboardMetricKey.UNEMPLOYMENT_US]: "Unemployment Rate — U.S.",
};

export function getFredSeriesByMetricKey(
  key: DashboardMetricKey,
): FredSeriesDefinition | undefined {
  return FRED_DASHBOARD_SERIES.find((s) => s.metricKeys.includes(key));
}

/** Dashboard title → metric key (excludes duplicate dual-line keys). */
export const TITLE_TO_METRIC_KEY: Partial<
  Record<string, DashboardMetricKey>
> = {
  [METRIC_KEY_TO_TITLE[DashboardMetricKey.M2]]: DashboardMetricKey.M2,
  [METRIC_KEY_TO_TITLE[DashboardMetricKey.FED_FUNDS]]:
    DashboardMetricKey.FED_FUNDS,
  [METRIC_KEY_TO_TITLE[DashboardMetricKey.CPI_US]]: DashboardMetricKey.CPI_US,
  [METRIC_KEY_TO_TITLE[DashboardMetricKey.NATIONAL_DEBT]]:
    DashboardMetricKey.NATIONAL_DEBT,
  [METRIC_KEY_TO_TITLE[DashboardMetricKey.GDP_US]]: DashboardMetricKey.GDP_US,
  [METRIC_KEY_TO_TITLE[DashboardMetricKey.UNEMPLOYMENT_US]]:
    DashboardMetricKey.UNEMPLOYMENT_US,
};

/** FRED series IDs wired in Phase 1 (for audits). */
export const FRED_SERIES_AUDIT: ReadonlyArray<{
  metric: string;
  seriesId: string;
  transform: FredValueTransform;
}> = FRED_DASHBOARD_SERIES.map((s) => ({
  metric: s.metricKeys.join(", "),
  seriesId: s.seriesId,
  transform: s.transform,
}));
