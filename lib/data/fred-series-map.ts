/**
 * Central registry of FRED series used by the dashboard.
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
  CASE_SHILLER_DFW: "case_shiller_dfw",
  CASE_SHILLER_US: "case_shiller_us",
  UNEMPLOYMENT_TX: "unemployment_tx",
  CPI_DFW: "cpi_dfw",
  GDP_TX: "gdp_tx",
  HOUSEHOLD_INCOME_US: "household_income_us",
} as const;

export type DashboardMetricKey =
  (typeof DashboardMetricKey)[keyof typeof DashboardMetricKey];

export type FredValueTransform =
  | "none"
  | "trillionsFromBillions"
  | "trillionsFromMillions"
  | "cpiYearOverYear"
  | "gdpYearOverYear";

export type FredObservationFrequency = "monthly" | "quarterly" | "annual";

export type FredSeriesDefinition = {
  /** Internal registry id */
  id: string;
  /** FRED series_id */
  seriesId: string;
  /** Tried in order when primary seriesId returns no observations. */
  fallbackSeriesIds?: readonly string[];
  observationStart: string;
  transform: FredValueTransform;
  /** Dashboard metrics this series feeds */
  metricKeys: DashboardMetricKey[];
  description: string;
  observationFrequency?: FredObservationFrequency;
  comparisonLabels?: [string, string, string];
  comparisonOffsets?: [number, number, number];
};

export const FRED_DASHBOARD_SERIES: readonly FredSeriesDefinition[] = [
  {
    id: "treasury_10y",
    seriesId: "DGS10",
    observationStart: FRED_OBSERVATION_START,
    transform: "none",
    metricKeys: [DashboardMetricKey.TREASURY_10Y],
    description: "10-Year Treasury Constant Maturity Rate",
    observationFrequency: "monthly",
  },
  {
    id: "mortgage_30y",
    seriesId: "MORTGAGE30US",
    observationStart: FRED_OBSERVATION_START,
    transform: "none",
    metricKeys: [DashboardMetricKey.MORTGAGE_30Y],
    description: "30-Year Fixed Rate Mortgage Average",
    observationFrequency: "monthly",
  },
  {
    id: "m2",
    seriesId: "M2SL",
    observationStart: FRED_OBSERVATION_START,
    transform: "trillionsFromBillions",
    metricKeys: [DashboardMetricKey.M2],
    description: "M2 Money Stock",
    observationFrequency: "monthly",
  },
  {
    id: "unemployment_us",
    seriesId: "UNRATE",
    observationStart: FRED_OBSERVATION_START,
    transform: "none",
    metricKeys: [DashboardMetricKey.UNEMPLOYMENT_US],
    description: "Unemployment Rate",
    observationFrequency: "monthly",
  },
  {
    id: "cpi_us",
    seriesId: "CPIAUCSL",
    observationStart: FRED_OBSERVATION_START,
    transform: "cpiYearOverYear",
    metricKeys: [DashboardMetricKey.CPI_US],
    description: "CPI All Urban Consumers (YoY % derived)",
    observationFrequency: "monthly",
  },
  {
    id: "gdp_us",
    seriesId: "GDPC1",
    observationStart: FRED_OBSERVATION_START,
    transform: "gdpYearOverYear",
    metricKeys: [DashboardMetricKey.GDP_US],
    description: "Real GDP (YoY % derived)",
    observationFrequency: "quarterly",
    comparisonLabels: ["QoQ", "4-qtr", "12-qtr"],
    comparisonOffsets: [1, 4, 12],
  },
  {
    id: "fed_funds",
    seriesId: "FEDFUNDS",
    observationStart: FRED_OBSERVATION_START,
    transform: "none",
    metricKeys: [DashboardMetricKey.FED_FUNDS],
    description: "Federal Funds Effective Rate",
    observationFrequency: "monthly",
  },
  {
    id: "national_debt",
    seriesId: "GFDEBTN",
    observationStart: FRED_OBSERVATION_START,
    transform: "trillionsFromMillions",
    metricKeys: [DashboardMetricKey.NATIONAL_DEBT],
    description: "Federal Debt: Total Public Debt",
    observationFrequency: "monthly",
  },
  {
    id: "case_shiller_dfw",
    seriesId: "DAXRNSA",
    observationStart: FRED_OBSERVATION_START,
    transform: "none",
    metricKeys: [DashboardMetricKey.CASE_SHILLER_DFW],
    description:
      "S&P CoreLogic Case-Shiller TX-Dallas Home Price Index (seasonally adjusted)",
    observationFrequency: "monthly",
  },
  {
    id: "case_shiller_us",
    seriesId: "CSUSHPINSA",
    observationStart: FRED_OBSERVATION_START,
    transform: "none",
    metricKeys: [DashboardMetricKey.CASE_SHILLER_US],
    description:
      "S&P CoreLogic Case-Shiller U.S. National Home Price Index (seasonally adjusted)",
    observationFrequency: "monthly",
  },
  {
    id: "unemployment_tx",
    seriesId: "TXUR",
    observationStart: FRED_OBSERVATION_START,
    transform: "none",
    metricKeys: [DashboardMetricKey.UNEMPLOYMENT_TX],
    description: "Texas Unemployment Rate",
    observationFrequency: "monthly",
  },
  {
    id: "cpi_dfw",
    // CUURS37ASA0 was requested but is not a valid FRED series_id (API 400).
    seriesId: "CUURS37ASA0",
    fallbackSeriesIds: [
      "CUURA316SA0",
    ],
    observationStart: FRED_OBSERVATION_START,
    transform: "cpiYearOverYear",
    metricKeys: [DashboardMetricKey.CPI_DFW],
    description:
      "CPI-U All Items, Dallas-Fort Worth-Arlington TX (BLS via FRED CUURA316SA0)",
    observationFrequency: "monthly",
  },
  {
    id: "gdp_tx",
    seriesId: "TXRQGSP",
    observationStart: FRED_OBSERVATION_START,
    transform: "gdpYearOverYear",
    metricKeys: [DashboardMetricKey.GDP_TX],
    description:
      "Real Gross Domestic Product: All Industry Total in Texas (quarterly, YoY % derived)",
    observationFrequency: "quarterly",
    comparisonLabels: ["QoQ", "4-qtr", "12-qtr"],
    comparisonOffsets: [1, 4, 12],
  },
  {
    id: "household_income_us",
    seriesId: "MEHOINUSA646N",
    observationStart: "2021-01-01",
    transform: "none",
    metricKeys: [DashboardMetricKey.HOUSEHOLD_INCOME_US],
    description: "Median Household Income in the United States (annual, nominal)",
    observationFrequency: "annual",
    comparisonLabels: ["YoY", "2-yr", "3-yr"],
    comparisonOffsets: [1, 2, 3],
  },
] as const;

/** Maps dashboard metric keys to section metric titles. */
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
  [DashboardMetricKey.CASE_SHILLER_DFW]:
    "S&P CoreLogic/Cotality Case-Shiller TX-Dallas Home Price Index",
  [DashboardMetricKey.CASE_SHILLER_US]:
    "S&P CoreLogic/Cotality Case-Shiller U.S. National Home Price Index",
  [DashboardMetricKey.UNEMPLOYMENT_TX]: "Unemployment Rate — Texas",
  [DashboardMetricKey.CPI_DFW]: "CPI Inflation — DFW",
  [DashboardMetricKey.GDP_TX]: "Real GDP — Texas",
  [DashboardMetricKey.HOUSEHOLD_INCOME_US]: "Household Income — U.S.",
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
  [METRIC_KEY_TO_TITLE[DashboardMetricKey.CASE_SHILLER_DFW]]:
    DashboardMetricKey.CASE_SHILLER_DFW,
  [METRIC_KEY_TO_TITLE[DashboardMetricKey.CASE_SHILLER_US]]:
    DashboardMetricKey.CASE_SHILLER_US,
  [METRIC_KEY_TO_TITLE[DashboardMetricKey.UNEMPLOYMENT_TX]]:
    DashboardMetricKey.UNEMPLOYMENT_TX,
  [METRIC_KEY_TO_TITLE[DashboardMetricKey.CPI_DFW]]: DashboardMetricKey.CPI_DFW,
  [METRIC_KEY_TO_TITLE[DashboardMetricKey.GDP_TX]]: DashboardMetricKey.GDP_TX,
  [METRIC_KEY_TO_TITLE[DashboardMetricKey.HOUSEHOLD_INCOME_US]]:
    DashboardMetricKey.HOUSEHOLD_INCOME_US,
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
