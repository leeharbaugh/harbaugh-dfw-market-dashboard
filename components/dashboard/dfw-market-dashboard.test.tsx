// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DfwMarketDashboard } from "./dfw-market-dashboard";
import type { DashboardBundle } from "@/lib/dfw-dashboard-sample-data";
import { SITE_DESTINATIONS } from "@/lib/site-destinations";

vi.mock("@/components/dashboard/metric-card", () => ({
  MetricCard: ({ metric }: { metric: { title: string } }) => (
    <div data-testid="metric-card">{metric.title}</div>
  ),
}));

vi.mock("@/components/dashboard/dual-rate-metric-card", () => ({
  DualRateMetricCard: ({ metric }: { metric: { title: string } }) => (
    <div data-testid="dual-rate-card">{metric.title}</div>
  ),
}));

vi.mock("@/components/dashboard/market-notes-panel", () => ({
  MarketNotesPanel: () => <div data-testid="market-notes">Notes</div>,
}));

vi.mock("@/components/dashboard/section-heading", () => ({
  SectionHeading: ({ title }: { title: string }) => <h2>{title}</h2>,
}));

const sampleBundle: DashboardBundle = {
  dfw: [
    {
      title: "DFW Sales",
      format: "count",
      chartKind: "line",
      points: [],
      dataStatus: "fallback",
    },
  ],
  arlington: [],
  mansfield: [],
  national: [],
  regional: [],
};

afterEach(cleanup);

describe("DfwMarketDashboard header", () => {
  it("preserves dashboard actions and hosts the four-destination nav", () => {
    render(
      <DfwMarketDashboard initialData={sampleBundle} marketNotes={null} />,
    );

    expect(
      screen.getByRole("heading", { name: "Harbaugh DFW Market Dashboard" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Market Summary" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Refresh Data" }),
    ).toBeTruthy();

    expect(screen.getByRole("link", { name: "Rent vs Buy" }).getAttribute("href")).toBe(
      "https://calculators.harbaughrealestate.com/rent-vs-buy",
    );
    expect(
      screen
        .getByRole("link", { name: "Real Estate Investment Model" })
        .getAttribute("href"),
    ).toBe("https://calculators.harbaughrealestate.com/real-estate-investment");
    expect(
      screen.getByRole("link", { name: "Get in Touch" }).getAttribute("href"),
    ).toBe(SITE_DESTINATIONS.getInTouch);
    expect(
      screen
        .getByRole("link", { name: "Market Dashboard" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(screen.getByText("DFW Sales")).toBeTruthy();
  });
});
