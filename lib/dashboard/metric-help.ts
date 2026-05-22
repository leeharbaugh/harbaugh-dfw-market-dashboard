/** Plain-language tooltip copy for dashboard metrics (matched by title substring). */

const METRIC_HELP: ReadonlyArray<{ match: string; text: string }> = [
  {
    match: "Case-Shiller",
    text: "Tracks changes in residential home prices over time. It is an index, not a dollar price.",
  },
  {
    match: "CPI Inflation",
    text: "Measures changes in consumer prices. Inflation rates are calculated from the CPI index.",
  },
  {
    match: "M2 Money Supply",
    text: "Broad measure of money in circulation, including cash, deposits, and money-market funds.",
  },
  {
    match: "Federal Funds",
    text: "The interest rate banks charge each other for overnight loans; a key Fed policy lever.",
  },
  {
    match: "Treasury Yield",
    text: "Market yield on U.S. government bonds, often used as a benchmark for long-term rates.",
  },
  {
    match: "Mortgage Rate",
    text: "Average rate on a 30-year fixed-rate home loan; drives monthly payment affordability.",
  },
  {
    match: "30-Year Mortgage",
    text: "Average rate on a 30-year fixed-rate home loan compared with the 10-year Treasury yield.",
  },
  {
    match: "Months Supply",
    text: "Estimates how many months it would take to sell current inventory at the current sales pace.",
  },
  {
    match: "Median Home Price",
    text: "The middle sale price in the market: half of homes sold above and half below this level.",
  },
  {
    match: "Sales Volume",
    text: "Count of closed home sales in the period, indicating market activity.",
  },
  {
    match: "Real GDP",
    text: "Inflation-adjusted output of the economy. Growth rates show how fast activity is expanding.",
  },
  {
    match: "National Debt",
    text: "Total federal debt outstanding owed by the U.S. government.",
  },
  {
    match: "Unemployment Rate",
    text: "Share of the labor force that is unemployed and actively seeking work.",
  },
  {
    match: "Household Income",
    text: "Median income for U.S. households: half earn more and half earn less than this amount.",
  },
];

export function getMetricHelpText(title: string): string | undefined {
  for (const { match, text } of METRIC_HELP) {
    if (title.includes(match)) return text;
  }
  return undefined;
}
