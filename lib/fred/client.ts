import "server-only";

import type {
  FredFetchObservationsParams,
  FredObservation,
  FredObservationsResult,
} from "@/lib/fred/types";

const FRED_OBSERVATIONS_URL =
  "https://api.stlouisfed.org/fred/series/observations";

/** Next.js Data Cache TTL for FRED observation responses (6 hours). */
export const FRED_REVALIDATE_SECONDS = 21600;

const FRED_RETRY_MAX_ATTEMPTS = 3;
const FRED_RETRY_BACKOFF_MS = [300, 600, 1200] as const;

export class FredConfigError extends Error {
  constructor(message = "FRED_API_KEY is not configured") {
    super(message);
    this.name = "FredConfigError";
  }
}

export class FredFetchError extends Error {
  readonly seriesId: string;
  readonly status?: number;
  readonly retryAfterMs?: number;

  constructor(
    seriesId: string,
    message: string,
    options?: { status?: number; retryAfterMs?: number; cause?: unknown },
  ) {
    super(message);
    this.name = "FredFetchError";
    this.seriesId = seriesId;
    this.status = options?.status;
    this.retryAfterMs = options?.retryAfterMs;
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(response: Response): number | undefined {
  const header = response.headers.get("retry-after");
  if (!header) return undefined;

  const seconds = Number.parseInt(header, 10);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }

  const dateMs = Date.parse(header);
  if (Number.isFinite(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }

  return undefined;
}

function isRetryableFredFetchError(error: FredFetchError): boolean {
  const { status } = error;
  if (status === undefined) {
    return true;
  }
  return status === 429 || status >= 500;
}

function retryDelayMs(error: FredFetchError, attemptIndex: number): number {
  const backoff =
    FRED_RETRY_BACKOFF_MS[
      Math.min(attemptIndex, FRED_RETRY_BACKOFF_MS.length - 1)
    ];
  if (error.status === 429 && error.retryAfterMs !== undefined) {
    return Math.max(backoff, error.retryAfterMs);
  }
  return backoff;
}

async function fetchFredObservationsOnce(
  params: FredFetchObservationsParams,
  apiKey: string,
): Promise<FredObservationsResult> {
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
      next: { revalidate: FRED_REVALIDATE_SECONDS },
    });
  } catch (cause) {
    throw new FredFetchError(
      seriesId,
      `Network error while fetching FRED series ${seriesId}`,
      { cause },
    );
  }

  if (!response.ok) {
    const status = response.status;
    throw new FredFetchError(
      seriesId,
      `FRED API returned ${status} for series ${seriesId}`,
      {
        status,
        retryAfterMs:
          status === 429 ? parseRetryAfterMs(response) : undefined,
      },
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

  let lastError: FredFetchError | undefined;

  for (let attempt = 0; attempt <= FRED_RETRY_MAX_ATTEMPTS; attempt++) {
    try {
      return await fetchFredObservationsOnce(params, apiKey);
    } catch (error) {
      if (!(error instanceof FredFetchError)) {
        throw error;
      }
      lastError = error;
      if (
        !isRetryableFredFetchError(error) ||
        attempt >= FRED_RETRY_MAX_ATTEMPTS
      ) {
        throw error;
      }
      const delayMs = retryDelayMs(error, attempt);
      console.warn(
        `[fred] Retry ${attempt + 1}/${FRED_RETRY_MAX_ATTEMPTS} for ${params.seriesId} ` +
          `after ${delayMs}ms (${error.message})`,
      );
      await sleep(delayMs);
    }
  }

  throw lastError ?? new FredFetchError(params.seriesId, "FRED fetch failed");
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
