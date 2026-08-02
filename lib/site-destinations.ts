/**
 * Shared Harbaugh product destinations for the four-item tools navigation.
 *
 * Sources (do not invent alternate hosts):
 * - Calculator pages: Harbaugh Calculators custom production domain.
 * - Market Dashboard: this app’s production origin (`app/layout.tsx`).
 * - Get in Touch: same working destination as harbaugh-calculators
 *   `SiteToolsNav` (`https://harbaughrealestate.com/about.php`).
 *
 * Historical (no longer active destinations): the legacy PHP calculator pages
 * on harbaughrealestate.com. Permanent redirects from those URLs are a separate
 * Harbaugh Real Estate host task — this dashboard does not rely on them.
 */

export const SITE_DESTINATIONS = {
  rentVsBuy: "https://calculators.harbaughrealestate.com/rent-vs-buy",
  realEstateInvestment:
    "https://calculators.harbaughrealestate.com/real-estate-investment",
  /** Canonical dashboard origin; on this app the nav uses same-origin `/`. */
  marketDashboard: "https://dashboard.harbaughrealestate.com",
  getInTouch: "https://harbaughrealestate.com/about.php",
} as const;

export type SiteDestinationKey = keyof typeof SITE_DESTINATIONS;
