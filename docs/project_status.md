# Harbaugh DFW Market Dashboard — Project Status

**Last updated:** August 2, 2026
**Primary branch:** `main`
**Current phase:** Calculator destinations on custom production domain

This file tracks dashboard product and UX work. It is not a commit diary.

## Completed

### Calculator production destinations (Aug 2, 2026)

- Harbaugh Calculators is live at `calculators.harbaughrealestate.com`.
- Dashboard tools nav now links Rent vs Buy and Real Estate Investment Model to the direct custom-domain routes:
  - `https://calculators.harbaughrealestate.com/rent-vs-buy`
  - `https://calculators.harbaughrealestate.com/real-estate-investment`
- Canonical configuration lives in `lib/site-destinations.ts`; the dashboard does **not** rely on legacy PHP redirects.
- Permanent redirects from the old Harbaugh Real Estate PHP calculator URLs remain a **separate** host deployment task and are not activated from this repository.
- The proposed secured dashboard-refresh control in Harbaugh Forms remains deferred and is outside this change.

### Shared four-destination tools navigation (Aug 2, 2026)

- Added `SiteToolsNav` matching the Harbaugh Calculators button experience: Rent vs Buy, Real Estate Investment Model, Market Dashboard, Get in Touch.
- Desktop (`lg+`): one balanced four-column row; narrower viewports: deliberate 2×2 grid (no accidental wrapping).
- Market Dashboard is the active destination (`aria-current="page"`) with a navy current-page treatment distinguishable from the gold Get in Touch accent.
- Preserved existing header actions (Market Summary, Refresh Data), back link, metrics, charts, APIs, and data behavior.
- Introduced shared `lib/design-tokens.ts` button/back-link classes for reuse with the calculators visual language.
- Added Vitest + Testing Library; focused nav tests and a dashboard header regression test.

## Current Work

None beyond optional physical-device QA of the navigation and a post-deploy smoke test of the two calculator links.

## Open Items

- Push and deploy the dashboard commit that points at the custom-domain calculator routes; production-smoke-test both dashboard links.
- Configure direct permanent redirects on the legacy Harbaugh Real Estate PHP URLs (`/rent-vs-buy-calculator.php`, `/investment-calculator.php`) — separate repository/host task; verify old URLs and query-string preservation after that work.
- Get in Touch uses `https://harbaughrealestate.com/contact` (same href as calculators `SiteToolsNav`); that path currently 404s on the public site until the contact page is published.
- Later: read-only audit for a secured dashboard-refresh feature (Harbaugh Forms); deferred and out of scope here.
- Optional physical-device QA of nav at phone/tablet widths.
