import { NextResponse } from "next/server";
import { loadDashboardData } from "@/lib/data/load-dashboard-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seedParam = searchParams.get("seed");
  const seed = seedParam ? Number(seedParam) : 0;
  const safeSeed = Number.isFinite(seed) ? seed : 0;

  try {
    const data = await loadDashboardData(safeSeed);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load dashboard data";
    console.error("[api/dashboard]", message);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 },
    );
  }
}
