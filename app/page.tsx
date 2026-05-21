import { DfwMarketDashboard } from "@/components/dashboard/dfw-market-dashboard";
import { loadDashboardData } from "@/lib/data/load-dashboard-data";

export default async function Home() {
  const data = await loadDashboardData();
  return <DfwMarketDashboard initialData={data} />;
}
