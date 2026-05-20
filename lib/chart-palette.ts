/** Neutral dashboard palette — no directional red/green. */
export const CHART = {
  navy: "#1e3a5f",
  mutedBlue: "#5b7c99",
  charcoal: "#44403c",
  warmGray: "#78716c",
  mutedGold: "#b8aa7a",
  fillBlue: "rgba(91, 124, 153, 0.18)",
  fillGray: "rgba(120, 113, 108, 0.16)",
} as const;

export const CHART_CYCLE = [
  CHART.navy,
  CHART.mutedBlue,
  CHART.charcoal,
  CHART.warmGray,
  CHART.mutedGold,
] as const;
