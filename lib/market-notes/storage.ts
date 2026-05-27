import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import { BlobNotFoundError, get, put } from "@vercel/blob";

import type { MarketNotesRecord } from "@/lib/market-notes/types";

/**
 * Storage adapter for the GLOBAL Market Notes record.
 *
 * Market Notes are shared across all visitors — there is exactly one
 * "current" record at any time. This module abstracts the underlying
 * persistence so we can swap backends without touching the generator
 * or the route handlers.
 *
 * Adapter selection order (first match wins):
 *   1. Vercel Blob, when `BLOB_READ_WRITE_TOKEN` is set. This is the
 *      production path on Vercel — durable, shared across regions and
 *      cold starts, automatically wired by Vercel's Blob integration.
 *   2. Filesystem adapter, when `MARKET_NOTES_FILE` is set OR when
 *      running outside production (defaults to `.market-notes/current.json`
 *      under the project root). Used for local development.
 *   3. In-memory adapter, last-resort fallback. Survives only the
 *      lifetime of a single Node.js process. Logs a warning so it is
 *      obvious in production that real persistence still needs to be
 *      configured.
 */

export interface MarketNotesStorage {
  /** Returns the latest record, or null if nothing has been saved. */
  read(): Promise<MarketNotesRecord | null>;
  /** Persists the record as the new current global Market Notes. */
  write(record: MarketNotesRecord): Promise<void>;
  /** Human-readable identifier for logs / diagnostics. */
  readonly kind: string;
}

const DEFAULT_FILE_PATH = ".market-notes/current.json";
const BLOB_PATHNAME = "market-notes/current.json";

function isRecord(value: unknown): value is MarketNotesRecord {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<MarketNotesRecord>;
  return (
    typeof r.notes === "string" &&
    typeof r.generatedAt === "string" &&
    typeof r.model === "string" &&
    (r.source === "scheduled" || r.source === "manual") &&
    r.version === 1
  );
}

/**
 * Vercel Blob adapter — production storage.
 *
 * The Blob store is PRIVATE. Market Notes are read server-side from the
 * dashboard page and re-served to the browser as plain props, so the
 * underlying blob never needs to be publicly fetchable.
 *
 * Implementation notes:
 *  - Writes use `access: "private"` and `BLOB_READ_WRITE_TOKEN` to
 *    authenticate. We keep a single stable pathname
 *    (`market-notes/current.json`) with `addRandomSuffix: false` +
 *    `allowOverwrite: true` so the "current" record always lives at
 *    the same slot.
 *  - Reads use the SDK's `get(pathname, { access: "private", ... })`
 *    which streams the blob using the read-write token — a plain
 *    `fetch(url)` on a private blob would 401. `useCache: false`
 *    bypasses the Vercel CDN cache so the dashboard sees freshly
 *    regenerated content immediately. A missing blob (before the
 *    first generation) returns `null` so the dashboard can render
 *    its graceful fallback.
 *  - `cacheControlMaxAge: 60` is the minimum allowed by Vercel Blob.
 */
function createVercelBlobStorage(token: string): MarketNotesStorage {
  return {
    kind: "vercel-blob",
    async read() {
      try {
        const result = await get(BLOB_PATHNAME, {
          access: "private",
          useCache: false,
          token,
        });
        if (!result || result.statusCode !== 200) return null;
        const text = await new Response(result.stream).text();
        const parsed = JSON.parse(text) as unknown;
        return isRecord(parsed) ? parsed : null;
      } catch (error) {
        if (error instanceof BlobNotFoundError) return null;
        console.error(
          "[market-notes] Vercel Blob read failed:",
          error instanceof Error ? error.message : error,
        );
        return null;
      }
    },
    async write(record) {
      await put(BLOB_PATHNAME, JSON.stringify(record, null, 2), {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
        cacheControlMaxAge: 60,
        token,
      });
    },
  };
}

function createFilesystemStorage(filePath: string): MarketNotesStorage {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  return {
    kind: `filesystem:${absolutePath}`,
    async read() {
      try {
        const raw = await fs.readFile(absolutePath, "utf8");
        const parsed = JSON.parse(raw) as unknown;
        return isRecord(parsed) ? parsed : null;
      } catch (error) {
        const code = (error as NodeJS.ErrnoException)?.code;
        if (code === "ENOENT") return null;
        console.error(
          "[market-notes] Filesystem read failed:",
          error instanceof Error ? error.message : error,
        );
        return null;
      }
    },
    async write(record) {
      const dir = path.dirname(absolutePath);
      await fs.mkdir(dir, { recursive: true });
      const serialized = JSON.stringify(record, null, 2);
      await fs.writeFile(absolutePath, serialized, "utf8");
    },
  };
}

/**
 * Process-local in-memory fallback. Survives the lifetime of a single
 * Node.js process only. This is intentional — it makes local testing
 * trivial without writing a file, while making it obvious in production
 * logs that real persistence still needs to be configured.
 */
function createMemoryStorage(): MarketNotesStorage {
  let current: MarketNotesRecord | null = null;
  return {
    kind: "memory",
    async read() {
      return current;
    },
    async write(record) {
      current = record;
    },
  };
}

let cachedStorage: MarketNotesStorage | null = null;

export function getMarketNotesStorage(): MarketNotesStorage {
  if (cachedStorage) return cachedStorage;

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (blobToken) {
    cachedStorage = createVercelBlobStorage(blobToken);
    return cachedStorage;
  }

  const configuredPath = process.env.MARKET_NOTES_FILE?.trim();
  if (configuredPath) {
    cachedStorage = createFilesystemStorage(configuredPath);
    return cachedStorage;
  }

  if (process.env.NODE_ENV !== "production") {
    cachedStorage = createFilesystemStorage(DEFAULT_FILE_PATH);
    return cachedStorage;
  }

  console.warn(
    "[market-notes] No persistent storage configured. Falling back to " +
      "in-memory adapter — notes will not survive cold starts. Set " +
      "BLOB_READ_WRITE_TOKEN (recommended on Vercel) or MARKET_NOTES_FILE " +
      "to enable durable persistence.",
  );
  cachedStorage = createMemoryStorage();
  return cachedStorage;
}

/** Convenience reader used by the dashboard page (server component). */
export async function readLatestMarketNotes(): Promise<MarketNotesRecord | null> {
  try {
    return await getMarketNotesStorage().read();
  } catch (error) {
    console.error(
      "[market-notes] Failed to read latest notes:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

/** Convenience writer used by the API route. */
export async function saveMarketNotes(
  record: MarketNotesRecord,
): Promise<void> {
  await getMarketNotesStorage().write(record);
}
