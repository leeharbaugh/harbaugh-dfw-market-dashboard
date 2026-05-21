export type TrercObservation = {
  date: string;
  value: number;
};

/** Geo selector payload used by TRERC housing-activity-table POST. */
export type TrercGeoRequest = {
  geoId: string;
  geoName: string;
  geoTypeId: number;
  geoType: string;
  hashKey: string;
};

export type TrercSeriesField =
  | "median_close_price"
  | "months_inventory"
  | "closed_listings";

export type TrercHousingTableRow = {
  begin_date?: string;
  date_string?: string;
  median_close_price?: number;
  months_inventory?: number;
  closed_listings?: number;
  [key: string]: string | number | undefined;
};

export type TrercExportLinkKind = "csv" | "excel" | "unknown";

export type TrercExportLink = {
  kind: TrercExportLinkKind;
  /** Attribute or control identifier (not a direct download URL on TRERC pages). */
  control: string;
};

export type TrercGeographyFetchResult = {
  pageUrl: string;
  tableUrl: string;
  status: number;
  exportLinks: TrercExportLink[];
  rawRows: TrercHousingTableRow[];
  observationsByField: Record<string, TrercObservation[]>;
};
