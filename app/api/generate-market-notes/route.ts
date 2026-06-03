import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { loadDashboardData } from "@/lib/data/load-dashboard-data";
import { generateMarketNotes } from "@/lib/market-notes/generate";
import { isOpenAIConfigured } from "@/lib/market-notes/openai";
import { saveMarketNotes } from "@/lib/market-notes/storage";

/**
 * Protected route that regenerates the GLOBAL Market Notes record.
 *
 * Why this exists (architecture):
 *   - Market Notes are generated globally, not per user.
 *   - They are deliberately NOT generated on page load, on a normal
 *     "Refresh Data" click, or anywhere in the read path.
 *   - They are regenerated only in two ways:
 *       1. A monthly scheduled job (Vercel Cron — see vercel.json).
 *          Vercel sends `Authorization: Bearer ${CRON_SECRET}` when
 *          triggering the cron, which we accept here.
 *       2. A manual hit to this URL with `?secret=MARKET_NOTES_SECRET`,
 *          used by the site owner when the dashboard data changes
 *          out of band.
 *
 * Both paths share the same generation + persistence pipeline so the
 * dashboard always serves the latest saved notes from shared storage.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret");
  const expectedSecret = process.env.MARKET_NOTES_SECRET?.trim();
  if (expectedSecret && querySecret && timingSafeEqual(querySecret, expectedSecret)) {
    return true;
  }

  // Vercel Cron path: trigger requests carry `Authorization: Bearer <CRON_SECRET>`.
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

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function handle(request: Request): Promise<Response> {
  if (!process.env.MARKET_NOTES_SECRET && !process.env.CRON_SECRET) {
    console.error(
      "[market-notes] Refusing to run: neither MARKET_NOTES_SECRET nor CRON_SECRET is set.",
    );
    return NextResponse.json(
      { error: "Market notes regeneration is not configured." },
      { status: 503 },
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isOpenAIConfigured()) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 503 },
    );
  }

  const source: "manual" | "scheduled" =
    request.headers.get("authorization") && !new URL(request.url).searchParams.get("secret")
      ? "scheduled"
      : "manual";

  try {
    const data = await loadDashboardData();
    const record = await generateMarketNotes(data, { source });
    await saveMarketNotes(record);

    // Drop any cached RSC payload for the dashboard so the very next
    // page request re-runs the server component and picks up the
    // newly-written notes from shared storage.
    try {
      revalidatePath("/");
    } catch (error) {
      console.warn(
        "[market-notes] revalidatePath('/') failed:",
        error instanceof Error ? error.message : error,
      );
    }

    return NextResponse.json({
      ok: true,
      source,
      generatedAt: record.generatedAt,
      model: record.model,
      notes: record.notes,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate market notes";
    console.error("[market-notes] Generation failed:", message);
    return NextResponse.json(
      { error: "Failed to generate market notes", detail: message },
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
