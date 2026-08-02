// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SiteToolsNav } from "./site-tools-nav";
import { SITE_DESTINATIONS } from "@/lib/site-destinations";

const APPROVED_RENT_VS_BUY =
  "https://calculators.harbaughrealestate.com/rent-vs-buy";
const APPROVED_INVESTMENT =
  "https://calculators.harbaughrealestate.com/real-estate-investment";

const FORBIDDEN_HREFS = [
  "https://harbaughrealestate.com/rent-vs-buy-calculator.php",
  "https://harbaughrealestate.com/investment-calculator.php",
  "https://harbaugh-calculators.vercel.app",
] as const;

afterEach(cleanup);

describe("SiteToolsNav", () => {
  it("renders all four destinations with correct labels, order, and hrefs", () => {
    render(<SiteToolsNav active="market-dashboard" />);

    const nav = screen.getByRole("navigation", { name: "Harbaugh tools" });
    const links = within(nav).getAllByRole("link");

    expect(links.map((link) => link.textContent)).toEqual([
      "Rent vs Buy",
      "Real Estate Investment Model",
      "Market Dashboard",
      "Get in Touch",
    ]);

    expect(links[0].getAttribute("href")).toBe(APPROVED_RENT_VS_BUY);
    expect(links[1].getAttribute("href")).toBe(APPROVED_INVESTMENT);
    expect(links[2].getAttribute("href")).toBe("/");
    expect(links[3].getAttribute("href")).toBe(SITE_DESTINATIONS.getInTouch);

    expect(SITE_DESTINATIONS.rentVsBuy).toBe(APPROVED_RENT_VS_BUY);
    expect(SITE_DESTINATIONS.realEstateInvestment).toBe(APPROVED_INVESTMENT);
  });

  it("does not point any destination at legacy PHP or Vercel calculator URLs", () => {
    render(<SiteToolsNav active="market-dashboard" />);

    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href") ?? "");

    for (const forbidden of FORBIDDEN_HREFS) {
      expect(hrefs).not.toContain(forbidden);
    }
  });

  it("keeps responsive 2×2 / four-column grid classes", () => {
    const { container } = render(<SiteToolsNav active="market-dashboard" />);
    const list = container.querySelector("ul");

    expect(list?.className).toMatch(/grid-cols-2/);
    expect(list?.className).toMatch(/lg:grid-cols-4/);
  });

  it("marks Market Dashboard as the active page with aria-current", () => {
    render(<SiteToolsNav active="market-dashboard" />);

    expect(
      screen
        .getByRole("link", { name: "Market Dashboard" })
        .getAttribute("aria-current"),
    ).toBe("page");

    expect(
      screen.getByRole("link", { name: "Rent vs Buy" }).getAttribute(
        "aria-current",
      ),
    ).toBeNull();
    expect(
      screen
        .getByRole("link", { name: "Real Estate Investment Model" })
        .getAttribute("aria-current"),
    ).toBeNull();
    expect(
      screen.getByRole("link", { name: "Get in Touch" }).getAttribute(
        "aria-current",
      ),
    ).toBeNull();
  });

  it("keeps Get in Touch as the accent action, distinct from active", () => {
    render(<SiteToolsNav active="market-dashboard" />);

    const contact = screen.getByRole("link", { name: "Get in Touch" });
    const dashboard = screen.getByRole("link", { name: "Market Dashboard" });

    // Gold accent vs navy current — distinguishable treatments.
    expect(contact.className).toMatch(/d8cfa8/);
    expect(dashboard.className).toMatch(/1e3a5f/);
    expect(dashboard.className).not.toMatch(/d8cfa8/);
    expect(contact.getAttribute("href")).toBe(SITE_DESTINATIONS.getInTouch);
    expect(contact.getAttribute("aria-current")).toBeNull();
  });

  it("exposes keyboard-accessible links with visible focus affordances", () => {
    render(<SiteToolsNav />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(4);

    for (const link of links) {
      expect(link.tagName).toBe("A");
      expect(link.getAttribute("href")).toBeTruthy();
      expect(link.className).toMatch(/focus-visible:outline/);
      expect(link.className).toMatch(/min-h-10/);
    }

    for (const name of [
      "Rent vs Buy",
      "Real Estate Investment Model",
      "Get in Touch",
    ]) {
      const link = screen.getByRole("link", { name });
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toMatch(/noopener/);
    }

    expect(
      screen
        .getByRole("link", { name: "Market Dashboard" })
        .getAttribute("target"),
    ).toBeNull();
  });
});
