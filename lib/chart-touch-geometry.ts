export type ChartPlotMargin = {
  top: number;
  right: number;
  left: number;
  bottom: number;
};

export type ChartTouchGeometry = {
  pointCount: number;
  margin: ChartPlotMargin;
  yAxisWidth: number;
};

export function resolveChartTouchIndex(
  clientX: number,
  rect: DOMRect,
  geometry: ChartTouchGeometry,
): { index: number; cursorX: number } {
  const { pointCount, margin, yAxisWidth } = geometry;

  if (pointCount <= 0) {
    return { index: 0, cursorX: yAxisWidth + margin.left };
  }

  const plotLeft = rect.left + yAxisWidth + margin.left;
  const plotRight = rect.right - margin.right;
  const plotWidth = plotRight - plotLeft;

  if (plotWidth <= 0) {
    return { index: 0, cursorX: yAxisWidth + margin.left };
  }

  const clampedX = Math.max(plotLeft, Math.min(plotRight, clientX));
  const ratio = (clampedX - plotLeft) / plotWidth;
  const maxIndex = Math.max(0, pointCount - 1);
  const index = Math.round(ratio * maxIndex);
  const snappedX =
    plotLeft + (maxIndex > 0 ? (index / maxIndex) * plotWidth : 0);
  const cursorX = snappedX - rect.left;

  return { index, cursorX };
}
