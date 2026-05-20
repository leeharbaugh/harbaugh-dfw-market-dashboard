"use client";

import { useMemo, useState } from "react";
import { DualRateMetricCard } from "@/components/dashboard/dual-rate-metric-card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { buildDashboardMetrics } from "@/lib/dfw-dashboard-sample-data";

function renderNationalMetric(
  m: ReturnType<typeof buildDashboardMetrics>["national"][number],
  i: number,
) {
  if (m.chartKind === "dual-line") {
    return <DualRateMetricCard key={`nat-${i}-${m.title}`} metric={m} />;
  }
  return <MetricCard key={`nat-${i}-${m.title}`} metric={m} />;
}

export function DfwMarketDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const data = useMemo(
    () => buildDashboardMetrics(refreshKey * 2654435761),
    [refreshKey],
  );

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
          <div className="min-w-0 space-y-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-stone-400">
              Prototype · sample data
            </p>
            <h1 className="text-balance font-sans text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
              Harbaugh DFW Market Dashboard
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-stone-500 sm:text-base">
              A compact read on North Texas housing, mortgage markets, and the
              broader economy. Figures shown are illustrative only.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
            <p className="text-xs text-stone-400 tabular-nums">As of {asOf}</p>
            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="inline-flex items-center justify-center rounded-full border border-[#c9be92]/55 bg-[#d8cfa8]/85 px-4 py-2 text-sm font-medium text-stone-800 shadow-sm shadow-stone-900/5 transition hover:border-[#b8aa7a]/70 hover:bg-[#cdc39a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400/80 active:translate-y-px"
            >
              Refresh sample data
            </button>
          </div>
        </header>

        <main className="mt-10 space-y-12 sm:mt-12 sm:space-y-14">
          <section aria-labelledby="dfw-housing-heading">
            <SectionHeading
              eyebrow="Housing"
              title="DFW housing market"
              description="Metro-wide resale trends in this sample window."
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
              description="Side-by-side read on two high-volume corridors."
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
              title="Market notes"
              description="Manual commentary — edit each period before publishing."
              id="notes-heading"
            />
            <div className="rounded-2xl border border-stone-200/80 bg-white/70 p-5 shadow-sm shadow-stone-900/[0.04] ring-1 ring-stone-900/[0.02] backdrop-blur-sm sm:p-6">
              <p className="text-sm leading-relaxed text-stone-500">
                Add your market notes here. This section is intended for manual
                narrative updates each reporting period — inventory tone, rate
                sensitivity, and hyperlocal observations for Arlington and
                Mansfield.
              </p>
            </div>
          </section>
        </main>

        <footer className="mt-14 border-t border-stone-200/80 pt-8 text-xs leading-relaxed text-stone-400">
          <p>
            Harbaugh DFW Market Dashboard is a non-production interface. All
            metrics, charts, and commentary use fabricated sample data for layout
            and interaction testing only. Do not use for decisions, disclosures,
            or valuation.
          </p>
        </footer>
      </div>
    </div>
  );
}
