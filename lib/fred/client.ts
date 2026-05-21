import "server-only";

import type {
  FredFetchObservationsParams,
  FredObservation,
  FredObservationsResult,
} from "@/lib/fred/types";

const FRED_OBSERVATIONS_URL =
  "https://api.stlouisfed.org/fred/series/observations";

export class FredConfigError extends Error {
  constructor(message = "FRED_API_KEY is not configured") {
    super(message);
    this.name = "FredConfigError";
  }
}

export class FredFetchError extends Error {
  readonly seriesId: string;
  readonly status?: number;

  constructor(
    seriesId: string,
    message: string,
    options?: { status?: number; cause?: unknown },
  ) {
    super(message);
    this.name = "FredFetchError";
    this.seriesId = seriesId;
    this.status = options?.status;
    if (options?.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

type FredApiObservationRow = {
  date?: string;
  value?: string;
};

type FredApiObservationsResponse = {
  observations?: FredApiObservationRow[];
  error_code?: number;
  error_message?: string;
};

function getFredApiKey(): string | undefined {
  const key = process.env.FRED_API_KEY?.trim();
  return key || undefined;
}

export function isFredConfigured(): boolean {
  return Boolean(getFredApiKey());
}

function normalizeObservations(
  rows: FredApiObservationRow[] | undefined,
): FredObservation[] {
  if (!rows?.length) return [];

  const out: FredObservation[] = [];
  for (const row of rows) {
    const date = row.date?.trim();
    const raw = row.value?.trim();
    if (!date || !raw || raw === ".") continue;

    const value = Number.parseFloat(raw);
    if (!Number.isFinite(value)) continue;

    out.push({ date, value });
  }

  return out;
}

/**
 * Fetches and normalizes FRED series observations.
 * Returns null when no API key is set (caller should use sample fallback).
 */
export async function fetchFredObservations(
  params: FredFetchObservationsParams,
): Promise<FredObservationsResult | null> {
  const apiKey = getFredApiKey();
  if (!apiKey) {
    return null;
  }

  const { seriesId, observationStart } = params;
  const url = new URL(FRED_OBSERVATIONS_URL);
  url.searchParams.set("series_id", seriesId);
  url.searchParams.set("observation_start", observationStart);
  url.searchParams.set("file_type", "json");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("sort_order", "asc");

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });
  } catch (cause) {
    throw new FredFetchError(
      seriesId,
      `Network error while fetching FRED series ${seriesId}`,
      { cause },
    );
  }

  if (!response.ok) {
    throw new FredFetchError(
      seriesId,
      `FRED API returned ${response.status} for series ${seriesId}`,
      { status: response.status },
    );
  }

  let body: FredApiObservationsResponse;
  try {
    body = (await response.json()) as FredApiObservationsResponse;
  } catch (cause) {
    throw new FredFetchError(
      seriesId,
      `Invalid JSON from FRED for series ${seriesId}`,
      { cause },
    );
  }

  if (body.error_code) {
    throw new FredFetchError(
      seriesId,
      body.error_message ??
        `FRED API error ${body.error_code} for series ${seriesId}`,
    );
  }

  const observations = normalizeObservations(body.observations);
  if (observations.length === 0) {
    throw new FredFetchError(
      seriesId,
      `No valid observations returned for FRED series ${seriesId}`,
    );
  }

  return { seriesId, observations };
}

export async function fetchFredObservationsSafe(
  params: FredFetchObservationsParams,
): Promise<FredObservationsResult | null> {
  try {
    return await fetchFredObservations(params);
  } catch (error) {
    if (error instanceof FredConfigError) {
      return null;
    }
    const message =
      error instanceof Error ? error.message : "Unknown FRED error";
    console.error(
      `[fred] Failed to load ${params.seriesId}: ${message}`,
    );
    return null;
  }
}
