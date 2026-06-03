import "server-only";

import {
  fetchFredSeriesRegistryLive,
  type FredSeriesLoadResult,
} from "@/lib/data/fred-fetch-registry";
import type { FredRegistryCacheRecord } from "@/lib/fred/cache-types";
import {
  getFredRegistryCacheStorage,
  readFredRegistryCacheRecord,
  writeFredRegistryCacheRecord,
} from "@/lib/fred/cache-storage";
import { FRED_REVALIDATE_SECONDS, isFredConfigured } from "@/lib/fred/client";

/** Max age before a cached registry is refreshed on read (default: 6 hours). */
export const FRED_CACHE_MAX_AGE_SECONDS =
  Number.parseInt(process.env.FRED_CACHE_MAX_AGE_SECONDS ?? "", 10) ||
  FRED_REVALIDATE_SECONDS;

export type GetFredSeriesRegistryOptions = {
  /** Bypass cache and fetch all series from the FRED API. */
  forceLive?: boolean;
};

export type FredRegistryCacheRefreshResult = {
  fetchedAt: string;
  dataSource: "live";
  storageKind: string;
  seriesCount: number;
  liveCount: number;
  errorCount: number;
};

function isFredCacheDisabled(): boolean {
  const flag = process.env.FRED_CACHE_DISABLED?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "on";
}

function isCacheRecordStale(fetchedAt: string): boolean {
  const fetchedMs = Date.parse(fetchedAt);
  if (!Number.isFinite(fetchedMs)) return true;
  const ageMs = Date.now() - fetchedMs;
  return ageMs > FRED_CACHE_MAX_AGE_SECONDS * 1000;
}

function registryFromRecord(
  record: FredRegistryCacheRecord,
): Map<string, FredSeriesLoadResult> {
  const registry = new Map<string, FredSeriesLoadResult>();
  for (const entry of record.entries) {
    registry.set(entry.definitionId, entry.result);
  }
  return registry;
}

function recordFromRegistry(
  registry: Map<string, FredSeriesLoadResult>,
  fetchedAt: string,
): FredRegistryCacheRecord {
  return {
    version: 1,
    fetchedAt,
    entries: Array.from(registry.entries()).map(([definitionId, result]) => ({
      definitionId,
      result,
    })),
  };
}

function summarizeRegistry(registry: Map<string, FredSeriesLoadResult>) {
  let liveCount = 0;
  let errorCount = 0;
  for (const result of registry.values()) {
    if (result.ok) liveCount += 1;
    else errorCount += 1;
  }
  return { seriesCount: registry.size, liveCount, errorCount };
}

async function persistRegistry(
  registry: Map<string, FredSeriesLoadResult>,
  fetchedAt: string,
): Promise<void> {
  try {
    await writeFredRegistryCacheRecord(recordFromRegistry(registry, fetchedAt));
  } catch (error) {
    console.error(
      "[fred-cache] Failed to persist registry:",
      error instanceof Error ? error.message : error,
    );
  }
}

/**
 * Returns the assembled FRED registry, preferring a warm shared cache.
 *
 * - Default: read cache when fresh; otherwise live fetch + persist.
 * - `forceLive`: always live fetch + persist (used by cron and explicit refresh).
 * - On live failure with a stale cache present, serves stale cache.
 */
export async function getFredSeriesRegistry(
  options?: GetFredSeriesRegistryOptions,
): Promise<Map<string, FredSeriesLoadResult>> {
  if (!isFredConfigured()) {
    return fetchFredSeriesRegistryLive();
  }

  const forceLive = options?.forceLive === true;
  const cacheDisabled = isFredCacheDisabled();

  if (!forceLive && !cacheDisabled) {
    const cached = await readFredRegistryCacheRecord();
    if (cached && !isCacheRecordStale(cached.fetchedAt)) {
      return registryFromRecord(cached);
    }
  }

  const staleCache =
    !forceLive && !cacheDisabled
      ? await readFredRegistryCacheRecord()
      : null;

  try {
    const registry = await fetchFredSeriesRegistryLive();
    const fetchedAt = new Date().toISOString();
    if (!cacheDisabled) {
      await persistRegistry(registry, fetchedAt);
    }
    return registry;
  } catch (error) {
    if (staleCache) {
      console.warn(
        "[fred-cache] Live fetch failed; serving stale cache from",
        staleCache.fetchedAt,
        error instanceof Error ? error.message : error,
      );
      return registryFromRecord(staleCache);
    }
    throw error;
  }
}

/**
 * Forces a live FRED fetch and writes the assembled registry to shared storage.
 * Used by the scheduled cache-warmer and protected manual refresh route.
 */
export async function refreshFredRegistryCache(): Promise<FredRegistryCacheRefreshResult> {
  const registry = await fetchFredSeriesRegistryLive();
  const fetchedAt = new Date().toISOString();
  await writeFredRegistryCacheRecord(recordFromRegistry(registry, fetchedAt));

  const { seriesCount, liveCount, errorCount } = summarizeRegistry(registry);

  return {
    fetchedAt,
    dataSource: "live",
    storageKind: getFredRegistryCacheStorage().kind,
    seriesCount,
    liveCount,
    errorCount,
  };
}

export async function getFredRegistryCacheStatus(): Promise<{
  configured: boolean;
  cacheDisabled: boolean;
  maxAgeSeconds: number;
  cached: {
    fetchedAt: string;
    stale: boolean;
    seriesCount: number;
    liveCount: number;
    errorCount: number;
  } | null;
}> {
  const record = await readFredRegistryCacheRecord();
  if (!record) {
    return {
      configured: isFredConfigured(),
      cacheDisabled: isFredCacheDisabled(),
      maxAgeSeconds: FRED_CACHE_MAX_AGE_SECONDS,
      cached: null,
    };
  }

  const registry = registryFromRecord(record);
  const { seriesCount, liveCount, errorCount } = summarizeRegistry(registry);

  return {
    configured: isFredConfigured(),
    cacheDisabled: isFredCacheDisabled(),
    maxAgeSeconds: FRED_CACHE_MAX_AGE_SECONDS,
    cached: {
      fetchedAt: record.fetchedAt,
      stale: isCacheRecordStale(record.fetchedAt),
      seriesCount,
      liveCount,
      errorCount,
    },
  };
}
