# Harbaugh DFW Market Dashboard — Durable Decisions

This file records settled product and architectural decisions for the market dashboard. It is not a task list or implementation diary.

## Application-wide — Emerging Harbaugh Real Estate UX language

- Harbaugh Calculators and this economic/market dashboard form the emerging UX foundation for the eventual redesign of HarbaughRealEstate.com.
- Shared presentation patterns—navigation, buttons, spacing, typography, focus states, and responsive breakpoints—should remain consistent across those products so users perceive one product family.
- Cross-project consistency does **not** require coupling the applications’ business logic, data pipelines, or calculation engines. Reproduce approved experiences in each repository’s architecture without shared packages unless explicitly approved later.

## Navigation — Four destinations

- Product navigation provides a consistent four-destination experience: **Rent vs Buy**, **Real Estate Investment Model**, **Market Dashboard**, and **Get in Touch**.
- At desktop widths, the four destinations appear as one intentional balanced row.
- At tablet and mobile widths, destinations use an intentional **2×2** arrangement rather than uncontrolled wrapping.
- The current surface marks its own destination active (here: Market Dashboard) with `aria-current="page"`.
- **Get in Touch** remains the recognizable accent action and must stay visually distinguishable from the active destination treatment.
- Dashboard-specific header actions (for example Market Summary and Refresh Data) may sit beside the title metadata; they are not substitutes for the four-destination product nav.

## Navigation — Calculator production destinations

- Harbaugh Calculators is the live production surface at `calculators.harbaughrealestate.com`.
- Dashboard calculator destinations use the direct custom-domain routes (not the temporary Vercel hostname, and not the legacy PHP paths):
  - Rent vs Buy → `https://calculators.harbaughrealestate.com/rent-vs-buy`
  - Real Estate Investment Model → `https://calculators.harbaughrealestate.com/real-estate-investment`
- Canonical hrefs live in `lib/site-destinations.ts` so rendered instances stay consistent.
- The dashboard does **not** depend on legacy PHP redirects. Permanent redirects from the former Harbaugh Real Estate PHP calculator URLs are a separate host deployment concern.
- A proposed secured dashboard-refresh control in Harbaugh Forms remains deferred and is outside dashboard destination work.

## Navigation — Same-window tool suite and contact destination

- The shared Harbaugh tools navigation uses **same-window** ordinary link navigation for Rent vs Buy, Real Estate Investment Model, Market Dashboard, and Get in Touch. Do not use `target="_blank"` or `window.open` for these destinations, including cross-subdomain calculator links.
- Get in Touch uses the same working canonical destination as Harbaugh Calculators: `https://harbaughrealestate.com/about.php` (not the obsolete `/contact` path that returns HTTP 404).
- Unrelated external links elsewhere may still open in a new tab when intentionally configured.
- No calculator or dashboard business logic is implied by navigation target behavior.
