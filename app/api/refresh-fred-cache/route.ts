import { NextResponse } from "next/server";

import { refreshFredRegistryCache } from "@/lib/fred/registry-cache";

/**
 * Warms the assembled FRED registry in shared storage.
 *
 * Triggered by:
 *   1. Vercel Cron (see vercel.json) — `Authorization: Bearer ${CRON_SECRET}`
 *   2. Manual refresh — `?secret=${FRED_CACHE_SECRET}` or `MARKET_NOTES_SECRET`
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function isAuthorized(request: Request): boolean {
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");

  const fredCacheSecret = process.env.FRED_CACHE_SECRET?.trim();
  if (
    fredCacheSecret &&
    querySecret &&
    timingSafeEqual(querySecret, fredCacheSecret)
  ) {
    return true;
  }

  const marketNotesSecret = process.env.MARKET_NOTES_SECRET?.trim();
  if (
    marketNotesSecret &&
    querySecret &&
    timingSafeEqual(querySecret, marketNotesSecret)
  ) {
    return true;
  }

  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret) {
    const header = request.headers.get("authorization") ?? "";
    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (match && timingSafeEqual(match[1], cronSecret)) {
      return true;
    }
  }

  return false;
}

async function handle(request: Request): Promise<NextResponse> {
  if (
    !process.env.CRON_SECRET?.trim() &&
    !process.env.FRED_CACHE_SECRET?.trim() &&
    !process.env.MARKET_NOTES_SECRET?.trim()
  ) {
    console.error(
      "[fred-cache] Refusing to run: set CRON_SECRET, FRED_CACHE_SECRET, or MARKET_NOTES_SECRET.",
    );
    return NextResponse.json(
      { error: "FRED cache refresh is not configured." },
      { status: 503 },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const source: "manual" | "scheduled" =
    request.headers.get("authorization") &&
    !new URL(request.url).searchParams.get("secret")
      ? "scheduled"
      : "manual";

  try {
    const result = await refreshFredRegistryCache();
    return NextResponse.json({ ok: true, source, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to refresh FRED cache";
    console.error("[fred-cache] Refresh failed:", message);
    return NextResponse.json(
      { error: "Failed to refresh FRED cache", detail: message },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
