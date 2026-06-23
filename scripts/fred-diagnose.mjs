/**
 * One-off diagnostic: fetch each dashboard FRED series and print status.
 * Usage: node --env-file=.env.local scripts/fred-diagnose.mjs
 */

const SERIES = [
  ["treasury_10y", "DGS10", "2021-05-01"],
  ["mortgage_30y", "MORTGAGE30US", "2021-05-01"],
  ["m2", "M2SL", "2021-05-01"],
  ["unemployment_us", "UNRATE", "2021-05-01"],
  ["cpi_us", "CPIAUCSL", "2021-05-01"],
  ["gdp_us", "GDPC1", "2021-05-01"],
  ["fed_funds", "FEDFUNDS", "2021-05-01"],
  ["national_debt", "GFDEBTN", "2021-05-01"],
  ["case_shiller_dfw", "DAXRNSA", "2021-05-01"],
  ["case_shiller_us", "CSUSHPINSA", "2021-05-01"],
  ["unemployment_tx", "TXUR", "2021-05-01"],
  ["cpi_dfw", "CUURA316SA0", "2021-05-01"],
  ["gdp_tx", "TXRQGSP", "2021-05-01"],
  ["household_income_us", "MEHOINUSA646N", "2021-01-01"],
];

const apiKey = process.env.FRED_API_KEY?.trim();
if (!apiKey) {
  console.error("FRED_API_KEY not set");
  process.exit(1);
}

const urlBase =
  "https://api.stlouisfed.org/fred/series/observations";

async function fetchSeries(id, seriesId, start) {
  const url = new URL(urlBase);
  url.searchParams.set("series_id", seriesId);
  url.searchParams.set("observation_start", start);
  url.searchParams.set("file_type", "json");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("sort_order", "asc");

  const t0 = Date.now();
  const res = await fetch(url);
  const ms = Date.now() - t0;
  if (!res.ok) {
    return { id, seriesId, ok: false, ms, error: `HTTP ${res.status}` };
  }
  const body = await res.json();
  if (body.error_code) {
    return {
      id,
      seriesId,
      ok: false,
      ms,
      error: `${body.error_code}: ${body.error_message}`,
    };
  }
  const valid = (body.observations ?? []).filter(
    (r) => r.value && r.value !== ".",
  ).length;
  return { id, seriesId, ok: valid > 0, ms, count: valid };
}

async function main() {
  const results = [];
  for (const row of SERIES) {
    results.push(await fetchSeries(...row));
  }
  for (const r of results) {
    console.log(
      r.ok ? "OK " : "FAIL",
      r.id.padEnd(22),
      r.seriesId,
      `${r.ms}ms`,
      r.ok ? `${r.count} obs` : r.error,
    );
  }
  const ok = results.filter((r) => r.ok).length;
  console.log(`\n${ok}/${results.length} succeeded`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
