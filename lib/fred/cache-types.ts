import type { FredSeriesLoadResult } from "@/lib/data/fred-fetch-registry";

/** Persisted assembled FRED registry (all series in one blob). */
export type FredRegistryCacheRecord = {
  version: 1;
  /** ISO-8601 timestamp when the registry was fetched from FRED. */
  fetchedAt: string;
  entries: FredRegistryCacheEntry[];
};

export type FredRegistryCacheEntry = {
  definitionId: string;
  result: FredSeriesLoadResult;
};
