"use client";

import { useCallback, useEffect, useState } from "react";
import { DualRateMetricCard } from "@/components/dashboard/dual-rate-metric-card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SectionHeading } from "@/components/dashboard/section-heading";
import type { DashboardBundle } from "@/lib/dfw-dashboard-sample-data";

function renderNationalMetric(
  m: DashboardBundle["national"][number],
  i: number,
) {
  if (m.chartKind === "dual-line") {
    return <DualRateMetricCard key={`nat-${i}-${m.title}`} metric={m} />;
  }
  return <MetricCard key={`nat-${i}-${m.title}`} metric={m} />;
}

type DfwMarketDashboardProps = {
  initialData: DashboardBundle;
};

export function DfwMarketDashboard({ initialData }: DfwMarketDashboardProps) {
  const [data, setData] = useState(initialData);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const metrics = [
      ...data.dfw,
      ...data.arlington,
      ...data.mansfield,
      ...data.national,
      ...data.regional,
    ];
    console.log("[dashboard] Client metric status");
    console.table(
      metrics.map((m) => ({
        title: m.title,
        status: m.dataStatus,
        fred: m.fredSeriesId ?? "—",
        updatedThrough: m.updatedThrough ?? "—",
        latest: m.points[m.points.length - 1]?.value,
      })),
    );
  }, [data]);

  const refresh = useCallback(async () => {
    const nextKey = refreshKey + 1;
    setRefreshing(true);
    try {
      const seed = nextKey * 2654435761;
      const res = await fetch(`/api/dashboard?seed=${seed}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const bundle = (await res.json()) as DashboardBundle;
        setData(bundle);
        setRefreshKey(nextKey);
      }
    } catch (error) {
      console.error("[dashboard] Refresh failed", error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshKey]);

  const nationalDual = data.national.filter((m) => m.chartKind === "dual-line");
  const nationalRest = data.national.filter((m) => m.chartKind !== "dual-line");

  const asOf = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-full bg-[#f5f3ef] font-sans text-stone-800">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-stone-200/80 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-3">
            <a
              href="https://harbaughrealestate.com"
              className="inline-flex w-fit items-center text-xs font-medium tracking-wide text-[#4a5568] transition-colors duration-150 hover:text-[#2c3440] focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400/70"
            >
              ← Harbaugh Real Estate
            </a>
            <h1 className="text-balance font-sans text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
              Harbaugh DFW Market Dashboard
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-stone-500 sm:text-base">
              A compact read on North Texas housing, mortgage markets, and the
              broader economy.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
            <p className="text-xs text-stone-400 tabular-nums">As of {asOf}</p>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={refreshing}
              className="inline-flex items-center justify-center rounded-full border border-[#c9be92]/55 bg-[#d8cfa8]/85 px-4 py-2 text-sm font-medium text-stone-800 shadow-sm shadow-stone-900/5 transition hover:border-[#b8aa7a]/70 hover:bg-[#cdc39a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400/80 active:translate-y-px disabled:opacity-60"
            >
              {refreshing ? "Refreshing…" : "Refresh Data"}
            </button>
          </div>
        </header>

        <main className="mt-10 space-y-12 sm:mt-12 sm:space-y-14">
          <section aria-labelledby="dfw-housing-heading">
            <SectionHeading
              eyebrow="Housing"
              title="DFW housing market"
              description="Metro-wide resale trends and pricing."
              id="dfw-housing-heading"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {data.dfw.map((m, i) => (
                <MetricCard key={`dfw-${i}-${m.title}`} metric={m} />
              ))}
            </div>
          </section>

          <section aria-labelledby="arl-mans-heading">
            <SectionHeading
              eyebrow="Local markets"
              title="Arlington & Mansfield housing market"
              description="Side-by-side read on Arlington and Mansfield markets"
              id="arl-mans-heading"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {data.arlington.map((m, i) => (
                <MetricCard key={`arl-${i}-${m.title}`} metric={m} />
              ))}
              {data.mansfield.map((m, i) => (
                <MetricCard key={`mans-${i}-${m.title}`} metric={m} />
              ))}
            </div>
          </section>

          <section aria-labelledby="national-heading">
            <SectionHeading
              eyebrow="Macro"
              title="National economy / rates"
              description="Rates, inflation, and national benchmarks that shape payment math."
              id="national-heading"
            />
            <div className="space-y-3">
              {nationalDual.map((m, i) => renderNationalMetric(m, i))}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {nationalRest.map((m, i) => renderNationalMetric(m, i + 100))}
              </div>
            </div>
          </section>

          <section aria-labelledby="regional-heading">
            <SectionHeading
              eyebrow="Regional"
              title="DFW / Texas economy"
              description="Texas and DFW labor and price conditions."
              id="regional-heading"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              {data.regional.map((m, i) => (
                <MetricCard key={`reg-${i}-${m.title}`} metric={m} />
              ))}
            </div>
          </section>

          <section aria-labelledby="notes-heading">
            <SectionHeading
              eyebrow="Narrative"
              title="Market Notes"
              description="Current observations and context for the latest market data."
              id="notes-heading"
            />
            <div className="rounded-2xl border border-stone-200/80 bg-white/70 p-5 shadow-sm shadow-stone-900/[0.04] ring-1 ring-stone-900/[0.02] backdrop-blur-sm sm:p-6">
              <p className="text-sm leading-relaxed text-stone-500">
                5/21/2026: Mortgage rates have continued to move higher. While home prices metro-wide have declined slightly, Mansfield and Arlington have seen price increases. In a positive sign, home sales have returned to 2022 levels, when rates began climbing.
              </p>
            </div>
          </section>
        </main>

        <footer className="mt-14 border-t border-stone-200/80 pt-8 text-xs leading-relaxed text-stone-400">
          <p>
            Sources: Freddie Mac Primary Mortgage Market Survey, Federal Reserve
            Economic Data (FRED), S&P CoreLogic Case-Shiller, and the Texas Real
            Estate Research Center at Texas A&M University. Data may be
            preliminary, revised, seasonally adjusted, or reported on different
            update schedules depending on the source.
          </p>
        </footer>
      </div>
    </div>
  );
}
