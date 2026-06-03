import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import { BlobNotFoundError, get, put } from "@vercel/blob";

import type { FredRegistryCacheRecord } from "@/lib/fred/cache-types";

/**
 * Persistence for the assembled FRED series registry.
 *
 * Adapter order (first match wins):
 *   1. Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set (production).
 *   2. Filesystem when `FRED_CACHE_FILE` is set or in non-production.
 *   3. In-memory fallback (single process; logs a warning in production).
 */

export interface FredRegistryCacheStorage {
  read(): Promise<FredRegistryCacheRecord | null>;
  write(record: FredRegistryCacheRecord): Promise<void>;
  readonly kind: string;
}

const DEFAULT_FILE_PATH = ".fred-cache/registry.json";
const BLOB_PATHNAME = "fred-cache/registry.json";

function isCacheRecord(value: unknown): value is FredRegistryCacheRecord {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<FredRegistryCacheRecord>;
  return (
    r.version === 1 &&
    typeof r.fetchedAt === "string" &&
    Array.isArray(r.entries)
  );
}

function createVercelBlobStorage(token: string): FredRegistryCacheStorage {
  return {
    kind: "vercel-blob",
    async read() {
      try {
        const result = await get(BLOB_PATHNAME, {
          access: "private",
          useCache: false,
          token,
        });
        if (!result || result.statusCode !== 200) {
          return null;
        }
        const text = await new Response(result.stream).text();
        const parsed = JSON.parse(text) as unknown;
        if (!isCacheRecord(parsed)) {
          console.error(
            "[fred-cache] Storage read failed: invalid record shape",
          );
          return null;
        }
        return parsed;
      } catch (error) {
        if (error instanceof BlobNotFoundError) {
          return null;
        }
        console.error(
          "[fred-cache] Storage read failed:",
          error instanceof Error ? error.message : error,
        );
        return null;
      }
    },
    async write(record) {
      await put(BLOB_PATHNAME, JSON.stringify(record), {
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

function createFilesystemStorage(filePath: string): FredRegistryCacheStorage {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  return {
    kind: `filesystem:${absolutePath}`,
    async read() {
      try {
        const raw = await fs.readFile(absolutePath, "utf8");
        const parsed = JSON.parse(raw) as unknown;
        if (!isCacheRecord(parsed)) {
          console.error(
            "[fred-cache] Storage read failed: invalid record shape",
          );
          return null;
        }
        return parsed;
      } catch (error) {
        const code = (error as NodeJS.ErrnoException)?.code;
        if (code === "ENOENT") return null;
        console.error(
          "[fred-cache] Storage read failed:",
          error instanceof Error ? error.message : error,
        );
        return null;
      }
    },
    async write(record) {
      const dir = path.dirname(absolutePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(absolutePath, JSON.stringify(record), "utf8");
    },
  };
}

function createMemoryStorage(): FredRegistryCacheStorage {
  let current: FredRegistryCacheRecord | null = null;
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

let cachedStorage: FredRegistryCacheStorage | null = null;

export function getFredRegistryCacheStorage(): FredRegistryCacheStorage {
  if (cachedStorage) return cachedStorage;

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (blobToken) {
    cachedStorage = createVercelBlobStorage(blobToken);
    return cachedStorage;
  }

  const configuredPath = process.env.FRED_CACHE_FILE?.trim();
  if (configuredPath) {
    cachedStorage = createFilesystemStorage(configuredPath);
    return cachedStorage;
  }

  if (process.env.NODE_ENV !== "production") {
    cachedStorage = createFilesystemStorage(DEFAULT_FILE_PATH);
    return cachedStorage;
  }

  console.warn(
    "[fred-cache] No persistent storage configured; using in-memory fallback",
  );
  cachedStorage = createMemoryStorage();
  return cachedStorage;
}

export async function readFredRegistryCacheRecord(): Promise<FredRegistryCacheRecord | null> {
  try {
    return await getFredRegistryCacheStorage().read();
  } catch (error) {
    console.error(
      "[fred-cache] Storage read failed:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export async function writeFredRegistryCacheRecord(
  record: FredRegistryCacheRecord,
): Promise<void> {
  await getFredRegistryCacheStorage().write(record);
}
