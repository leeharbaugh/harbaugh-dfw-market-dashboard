# Harbaugh DFW Market Dashboard — Project Status

**Last updated:** August 2, 2026
**Primary branch:** `main`
**Current phase:** Same-window tools navigation; contact destination aligned

This file tracks dashboard product and UX work. It is not a commit diary.

## Completed

### Contact URL and same-window tools navigation (Aug 2, 2026)

- Corrected Get in Touch from obsolete `https://harbaughrealestate.com/contact` (HTTP 404) to the calculators canonical destination `https://harbaughrealestate.com/about.php`.
- Shared tools nav now opens Rent vs Buy, Real Estate Investment Model, Market Dashboard, and Get in Touch in the **current browser window** (removed `target="_blank"` / `rel="noopener noreferrer"` from those links).
- Dashboard calculations, market data, charts, and Refresh Data behavior were unchanged.
- Durable decision recorded in `docs/decisions.md`.

### Calculator production destinations (Aug 2, 2026)

- Harbaugh Calculators is live at `calculators.harbaughrealestate.com`.
- Dashboard tools nav links Rent vs Buy and Real Estate Investment Model to the direct custom-domain routes:
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

None beyond optional physical-device QA and a post-deploy smoke test of same-window navigation across the three live tool pages.

## Open Items

- Push and deploy the contact/same-window navigation fix; production-smoke-test navigation from all three live pages.
- Configure direct permanent redirects on the legacy Harbaugh Real Estate PHP URLs (`/rent-vs-buy-calculator.php`, `/investment-calculator.php`) — separate repository/host task; verify old URLs and query-string preservation after that work.
- Later: read-only audit for a secured dashboard-refresh feature (Harbaugh Forms); deferred and out of scope here.
- Optional physical-device QA of nav at phone/tablet widths.
