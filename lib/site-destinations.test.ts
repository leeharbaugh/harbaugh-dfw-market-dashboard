import { describe, expect, it } from "vitest";

import { SITE_DESTINATIONS } from "./site-destinations";

const APPROVED = {
  rentVsBuy: "https://calculators.harbaughrealestate.com/rent-vs-buy",
  realEstateInvestment:
    "https://calculators.harbaughrealestate.com/real-estate-investment",
  marketDashboard: "https://dashboard.harbaughrealestate.com",
  getInTouch: "https://harbaughrealestate.com/about.php",
} as const;

const FORBIDDEN_DESTINATIONS = [
  "https://harbaughrealestate.com/rent-vs-buy-calculator.php",
  "https://harbaughrealestate.com/investment-calculator.php",
  "https://harbaugh-calculators.vercel.app",
  "https://harbaughrealestate.com/contact",
] as const;

describe("SITE_DESTINATIONS", () => {
  it("points calculator destinations at the custom production domain routes", () => {
    expect(SITE_DESTINATIONS.rentVsBuy).toBe(APPROVED.rentVsBuy);
    expect(SITE_DESTINATIONS.realEstateInvestment).toBe(
      APPROVED.realEstateInvestment,
    );
  });

  it("matches the calculators Get in Touch destination and keeps dashboard origin", () => {
    expect(SITE_DESTINATIONS.marketDashboard).toBe(APPROVED.marketDashboard);
    expect(SITE_DESTINATIONS.getInTouch).toBe(APPROVED.getInTouch);
  });

  it("does not use obsolete calculator hosts or the broken /contact path", () => {
    const active = Object.values(SITE_DESTINATIONS);
    for (const forbidden of FORBIDDEN_DESTINATIONS) {
      expect(active).not.toContain(forbidden);
    }
    expect(SITE_DESTINATIONS.rentVsBuy).not.toMatch(
      /rent-vs-buy-calculator\.php|harbaugh-calculators\.vercel\.app/,
    );
    expect(SITE_DESTINATIONS.realEstateInvestment).not.toMatch(
      /investment-calculator\.php|harbaugh-calculators\.vercel\.app/,
    );
  });
});
