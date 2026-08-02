/**
 * Harbaugh editorial design tokens — aligned with harbaugh-calculators.
 * Use these class strings so dashboard and calculators stay visually in sync.
 */

export const colors = {
  background: "#f5f3ef",
  foreground: "#1c1917",
  link: "#4a5568",
  linkHover: "#2c3440",
  accentNavy: "#1e3a5f",
  accentGold: "#d8cfa8",
  accentGoldBorder: "#c9be92",
  accentGoldHover: "#cdc39a",
  accentGoldBorderHover: "#b8aa7a",
} as const;

export const backLinkClass =
  "inline-flex w-fit items-center text-xs font-medium tracking-wide text-[#4a5568] transition-colors duration-150 hover:text-[#2c3440] focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400/70";

/** Outline / inactive destination control. */
export const buttonSecondaryClass =
  "inline-flex items-center justify-center rounded-full border border-stone-300/80 bg-white/40 px-4 py-2 text-sm font-medium text-stone-600 shadow-sm shadow-stone-900/[0.03] transition hover:border-stone-400/90 hover:bg-white/70 hover:text-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400/80 active:translate-y-px disabled:opacity-60";

/** Accent action (Get in Touch) — gold fill matching calculators primary. */
export const buttonPrimaryClass =
  "inline-flex items-center justify-center rounded-full border border-[#c9be92]/55 bg-[#d8cfa8]/85 px-4 py-2 text-sm font-medium text-stone-800 shadow-sm shadow-stone-900/5 transition hover:border-[#b8aa7a]/70 hover:bg-[#cdc39a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400/80 active:translate-y-px disabled:opacity-60";

/**
 * Current-page destination — navy treatment so the active Market Dashboard
 * stays distinguishable from the gold Get in Touch accent.
 */
export const buttonCurrentClass =
  "inline-flex items-center justify-center rounded-full border border-[#1e3a5f]/45 bg-[#1e3a5f]/12 px-4 py-2 text-sm font-medium text-[#1e3a5f] shadow-sm shadow-stone-900/[0.04] transition hover:border-[#1e3a5f]/65 hover:bg-[#1e3a5f]/18 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400/80 active:translate-y-px disabled:opacity-60";
