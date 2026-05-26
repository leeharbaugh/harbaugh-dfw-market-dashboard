import { DfwMarketDashboard } from "@/components/dashboard/dfw-market-dashboard";
import { loadDashboardData } from "@/lib/data/load-dashboard-data";
import { readLatestMarketNotes } from "@/lib/market-notes/storage";

export default async function Home() {
  // Page load reads dashboard data + the latest globally-saved Market
  // Notes from shared storage. It MUST NOT call OpenAI here — notes are
  // (re)generated only by the monthly cron or the protected manual
  // /api/generate-market-notes route.
  const [data, marketNotes] = await Promise.all([
    loadDashboardData(),
    readLatestMarketNotes(),
  ]);
  return <DfwMarketDashboard initialData={data} marketNotes={marketNotes} />;
}
