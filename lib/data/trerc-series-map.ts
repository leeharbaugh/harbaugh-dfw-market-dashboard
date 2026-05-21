/**
 * Central registry of TRERC housing series used by the dashboard.
 */
import type { TrercGeoRequest, TrercSeriesField } from "@/lib/trerc/types";

export const TRERC_OBSERVATION_START = "2021-05-01";

export const TrercDashboardMetricKey = {
  DFW_MEDIAN_PRICE: "dfw_median_price",
  DFW_MONTHS_SUPPLY: "dfw_months_supply",
  DFW_SALES_VOLUME: "dfw_sales_volume",
  ARLINGTON_MEDIAN_PRICE: "arlington_median_price",
  ARLINGTON_MONTHS_SUPPLY: "arlington_months_supply",
  MANSFIELD_MEDIAN_PRICE: "mansfield_median_price",
  MANSFIELD_MONTHS_SUPPLY: "mansfield_months_supply",
} as const;

export type TrercDashboardMetricKey =
  (typeof TrercDashboardMetricKey)[keyof typeof TrercDashboardMetricKey];

export type TrercGeographyDefinition = {
  id: string;
  pageUrl: string;
  geoData: TrercGeoRequest;
};

export type TrercSeriesDefinition = {
  id: string;
  geographyId: string;
  field: TrercSeriesField;
  metricKeys: TrercDashboardMetricKey[];
  description: string;
};

export const TRERC_GEOGRAPHIES: readonly TrercGeographyDefinition[] = [
  {
    id: "dfw_msa",
    pageUrl:
      "https://trerc.tamu.edu/housing-activity-data/msa/dallas-fort-worth-arlington/",
    geoData: {
      geoId: "8",
      geoName: "Dallas-Fort Worth-Arlington",
      geoTypeId: 2,
      geoType: "Metropolitan Statistical Area",
      hashKey: "MSA",
    },
  },
  {
    id: "arlington_lma",
    pageUrl: "https://trerc.tamu.edu/housing-activity-data/lma/arlington/",
    geoData: {
      geoId: "230",
      geoName: "Arlington",
      geoTypeId: 13,
      geoType: "Local Market Area",
      hashKey: "LMA",
    },
  },
  {
    id: "mansfield_lma",
    pageUrl: "https://trerc.tamu.edu/housing-activity-data/lma/mansfield/",
    geoData: {
      geoId: "410",
      geoName: "Mansfield",
      geoTypeId: 13,
      geoType: "Local Market Area",
      hashKey: "LMA",
    },
  },
] as const;

export const TRERC_DASHBOARD_SERIES: readonly TrercSeriesDefinition[] = [
  {
    id: "dfw_median_close_price",
    geographyId: "dfw_msa",
    field: "median_close_price",
    metricKeys: [TrercDashboardMetricKey.DFW_MEDIAN_PRICE],
    description: "DFW median closed sale price",
  },
  {
    id: "dfw_months_inventory",
    geographyId: "dfw_msa",
    field: "months_inventory",
    metricKeys: [TrercDashboardMetricKey.DFW_MONTHS_SUPPLY],
    description: "DFW months of inventory",
  },
  {
    id: "dfw_closed_listings",
    geographyId: "dfw_msa",
    field: "closed_listings",
    metricKeys: [TrercDashboardMetricKey.DFW_SALES_VOLUME],
    description: "DFW monthly closed sales",
  },
  {
    id: "arlington_median_close_price",
    geographyId: "arlington_lma",
    field: "median_close_price",
    metricKeys: [TrercDashboardMetricKey.ARLINGTON_MEDIAN_PRICE],
    description: "Arlington median closed sale price",
  },
  {
    id: "arlington_months_inventory",
    geographyId: "arlington_lma",
    field: "months_inventory",
    metricKeys: [TrercDashboardMetricKey.ARLINGTON_MONTHS_SUPPLY],
    description: "Arlington months of inventory",
  },
  {
    id: "mansfield_median_close_price",
    geographyId: "mansfield_lma",
    field: "median_close_price",
    metricKeys: [TrercDashboardMetricKey.MANSFIELD_MEDIAN_PRICE],
    description: "Mansfield median closed sale price",
  },
  {
    id: "mansfield_months_inventory",
    geographyId: "mansfield_lma",
    field: "months_inventory",
    metricKeys: [TrercDashboardMetricKey.MANSFIELD_MONTHS_SUPPLY],
    description: "Mansfield months of inventory",
  },
] as const;

export const TRERC_METRIC_KEY_TO_TITLE: Record<TrercDashboardMetricKey, string> =
  {
    [TrercDashboardMetricKey.DFW_MEDIAN_PRICE]: "Median Home Price — DFW",
    [TrercDashboardMetricKey.DFW_MONTHS_SUPPLY]: "Months Supply — DFW",
    [TrercDashboardMetricKey.DFW_SALES_VOLUME]: "Sales Volume — DFW",
    [TrercDashboardMetricKey.ARLINGTON_MEDIAN_PRICE]:
      "Arlington Median Home Price",
    [TrercDashboardMetricKey.ARLINGTON_MONTHS_SUPPLY]:
      "Arlington Months Supply",
    [TrercDashboardMetricKey.MANSFIELD_MEDIAN_PRICE]:
      "Mansfield Median Home Price",
    [TrercDashboardMetricKey.MANSFIELD_MONTHS_SUPPLY]:
      "Mansfield Months Supply",
  };

export const TITLE_TO_TRERC_METRIC_KEY: Partial<
  Record<string, TrercDashboardMetricKey>
> = Object.fromEntries(
  Object.entries(TRERC_METRIC_KEY_TO_TITLE).map(([key, title]) => [
    title,
    key as TrercDashboardMetricKey,
  ]),
);

export function getTrercGeographyById(
  id: string,
): TrercGeographyDefinition | undefined {
  return TRERC_GEOGRAPHIES.find((g) => g.id === id);
}
