export const CHART_HEIGHT_COMPACT = "h-[4.5rem]";
export const CHART_HEIGHT_PROMINENT = "h-[10rem] sm:h-[11rem]";

/** Room for sparse axes; Y width is set on YAxis separately. */
export const CHART_MARGIN_COMPACT = { top: 4, right: 6, left: 2, bottom: 0 };
export const CHART_MARGIN_PROMINENT = { top: 4, right: 8, left: 2, bottom: 0 };

export function chartHeightClass(prominent?: boolean): string {
  return prominent ? CHART_HEIGHT_PROMINENT : CHART_HEIGHT_COMPACT;
}

export function chartMargin(prominent?: boolean) {
  return prominent ? CHART_MARGIN_PROMINENT : CHART_MARGIN_COMPACT;
}
