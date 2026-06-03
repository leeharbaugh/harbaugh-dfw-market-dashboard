import { DfwMarketDashboard } from "@/components/dashboard/dfw-market-dashboard";
import { loadDashboardData } from "@/lib/data/load-dashboard-data";
import { readLatestMarketNotes } from "@/lib/market-notes/storage";

// Render the dashboard on every request. We rely on this so that:
//   - "Market Notes" reflect the most recent record written to shared
//     storage (Vercel Blob in prod), even seconds after a manual or
//     scheduled regeneration.
//   - Live FRED / TRERC overlays in `loadDashboardData` aren't pinned
//     to a build-time snapshot.
// The page still does NOT call OpenAI — it only reads the latest
// already-saved notes.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

export default async function Home() {
  const [data, marketNotes] = await Promise.all([
    loadDashboardData(),
    readLatestMarketNotes(),
  ]);
  return <DfwMarketDashboard initialData={data} marketNotes={marketNotes} />;
}
