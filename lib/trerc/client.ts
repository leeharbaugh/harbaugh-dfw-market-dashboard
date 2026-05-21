import "server-only";

import {
  TRERC_HOUSING_ACTIVITY_TABLE_URL,
  TRERC_OBSERVATION_START,
  TRERC_REVALIDATE_SECONDS,
} from "@/lib/trerc/constants";
import type {
  TrercExportLink,
  TrercGeoRequest,
  TrercHousingTableRow,
  TrercObservation,
  TrercSeriesField,
} from "@/lib/trerc/types";

export type { TrercGeoRequest, TrercSeriesField };

export class TrercFetchError extends Error {
  readonly context: string;
  readonly status?: number;

  constructor(
    context: string,
    message: string,
    options?: { status?: number; cause?: unknown },
  ) {
    super(message);
    this.name = "TrercFetchError";
    this.context = context;
    this.status = options?.status;
    if (options?.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

const TABLE_FIELDS: TrercSeriesField[] = [
  "median_close_price",
  "months_inventory",
  "closed_listings",
];

function parseTrercJsonBody<T>(text: string, context: string): T {
  let parsed: unknown = JSON.parse(text);
  if (typeof parsed === "string") {
    parsed = JSON.parse(parsed);
  }
  if (parsed === null || typeof parsed !== "object") {
    throw new TrercFetchError(context, "TRERC response was not a JSON object");
  }
  return parsed as T;
}

/** TRERC public housing pages do not expose stable direct CSV/XLS URLs; controls are client-side. */
export function discoverTrercExportLinks(html: string): TrercExportLink[] {
  const links: TrercExportLink[] = [];
  const csv = /data-table-action=["']csv["']/i.test(html);
  const excel = /data-table-action=["']excel["']/i.test(html);
  if (csv) {
    links.push({ kind: "csv", control: 'data-table-action="csv"' });
  }
  if (excel) {
    links.push({ kind: "excel", control: 'data-table-action="excel"' });
  }
  const hrefExports = [
    ...html.matchAll(/href=["']([^"']*(?:\.csv|\.xlsx|export)[^"']*)["']/gi),
  ].map((m) => m[1]);
  for (const href of hrefExports) {
    links.push({ kind: "unknown", control: href });
  }
  return links;
}

export async function fetchTrercPageHtml(pageUrl: string): Promise<{
  status: number;
  html: string;
  exportLinks: TrercExportLink[];
}> {
  console.log(`[trerc] Requested page URL: ${pageUrl}`);
  let response: Response;
  try {
    response = await fetch(pageUrl, {
      next: { revalidate: TRERC_REVALIDATE_SECONDS },
    });
  } catch (cause) {
    throw new TrercFetchError(
      pageUrl,
      `Network error fetching TRERC page ${pageUrl}`,
      { cause },
    );
  }

  console.log(`[trerc] Page response status: ${response.status} (${pageUrl})`);
  const html = await response.text();
  const exportLinks = discoverTrercExportLinks(html);
  console.log(
    `[trerc] Detected export controls for ${pageUrl}:`,
    exportLinks.length
      ? exportLinks.map((l) => `${l.kind}:${l.control}`).join(", ")
      : "(none — table data uses JSON API instead of direct file URLs)",
  );
  return { status: response.status, html, exportLinks };
}

function normalizeTableRows(
  rows: TrercHousingTableRow[],
  fields: TrercSeriesField[],
  observationStart = TRERC_OBSERVATION_START,
): Record<string, TrercObservation[]> {
  const out: Record<string, TrercObservation[]> = {};
  for (const field of fields) {
    out[field] = [];
  }

  const sorted = [...rows].sort((a, b) =>
    String(a.begin_date ?? "").localeCompare(String(b.begin_date ?? "")),
  );

  for (const row of sorted) {
    const date = row.begin_date?.trim();
    if (!date || date < observationStart) continue;

    for (const field of fields) {
      const raw = row[field];
      if (raw === undefined || raw === null) continue;
      const value = typeof raw === "number" ? raw : Number.parseFloat(String(raw));
      if (!Number.isFinite(value)) continue;
      out[field].push({ date, value });
    }
  }

  return out;
}

type TrercTableApiResponse = {
  status?: string;
  message?: string;
  rowData?: TrercHousingTableRow[];
};

/**
 * Loads monthly housing-activity table rows for one geography via TRERC JSON API.
 * Also fetches the public page once to log CSV/Excel UI controls (no direct file URLs).
 */
export async function fetchTrercGeographyHousingData(
  pageUrl: string,
  geoData: TrercGeoRequest,
): Promise<{
  exportLinks: TrercExportLink[];
  rawRows: TrercHousingTableRow[];
  observationsByField: Record<string, TrercObservation[]>;
}> {
  const page = await fetchTrercPageHtml(pageUrl);

  const body = {
    geoData,
    tableTypes: { period: "monthly" },
  };

  console.log(`[trerc] Requested table URL: ${TRERC_HOUSING_ACTIVITY_TABLE_URL}`);
  console.log(`[trerc] Table POST geoData:`, geoData);

  let response: Response;
  try {
    response = await fetch(TRERC_HOUSING_ACTIVITY_TABLE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      next: { revalidate: TRERC_REVALIDATE_SECONDS },
    });
  } catch (cause) {
    throw new TrercFetchError(
      pageUrl,
      `Network error fetching TRERC housing table for ${geoData.geoName}`,
      { cause },
    );
  }

  console.log(
    `[trerc] Table response status: ${response.status} (${geoData.geoName})`,
  );

  const text = await response.text();
  if (!response.ok) {
    throw new TrercFetchError(
      pageUrl,
      `TRERC table API returned ${response.status} for ${geoData.geoName}`,
      { status: response.status },
    );
  }

  const parsed = parseTrercJsonBody<TrercTableApiResponse>(text, geoData.geoName);
  if (parsed.status !== "success") {
    throw new TrercFetchError(
      pageUrl,
      parsed.message ?? `TRERC table API error for ${geoData.geoName}`,
    );
  }

  const rawRows = parsed.rowData ?? [];
  console.log(
    `[trerc] Parsed raw rows for ${geoData.geoName}: ${rawRows.length} monthly records`,
  );
  if (rawRows.length > 0) {
    console.log(`[trerc] First raw row (${geoData.geoName}):`, rawRows[0]);
    console.log(
      `[trerc] Last raw row (${geoData.geoName}):`,
      rawRows[rawRows.length - 1],
    );
  }

  const observationsByField = normalizeTableRows(rawRows, TABLE_FIELDS);
  for (const field of TABLE_FIELDS) {
    const series = observationsByField[field];
    console.log(
      `[trerc] Normalized ${geoData.geoName} ${field}: ${series.length} points`,
    );
    if (series.length > 0) {
      console.log(`[trerc]   first:`, series[0]);
      console.log(`[trerc]   last:`, series[series.length - 1]);
    }
  }

  if (
    !observationsByField.median_close_price?.length &&
    !observationsByField.months_inventory?.length &&
    !observationsByField.closed_listings?.length
  ) {
    console.warn(
      `[trerc] WARNING: No usable monthly observations after ${TRERC_OBSERVATION_START} for ${geoData.geoName}. ` +
        `Page export buttons are client-side only (AG Grid); stable CSV/XLS endpoints were not found. ` +
        `Verify geo IDs at ${pageUrl} if this persists.`,
    );
  }

  return {
    exportLinks: page.exportLinks,
    rawRows,
    observationsByField,
  };
}

export function isTrercLiveFetchEnabled(): boolean {
  const flag = process.env.TRERC_LIVE_DATA?.trim().toLowerCase();
  if (flag === "0" || flag === "false" || flag === "off") {
    return false;
  }
  return true;
}
