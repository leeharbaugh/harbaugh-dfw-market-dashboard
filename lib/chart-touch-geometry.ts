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

export type ChartTouchResolution = {
  index: number;
  cursorX: number;
  relativeX: number;
  containerWidth: number;
  plotWidth: number;
};

export function resolveChartTouchIndex(
  clientX: number,
  rect: DOMRect,
  geometry: ChartTouchGeometry,
): ChartTouchResolution {
  const { pointCount, margin, yAxisWidth } = geometry;

  const containerWidth = rect.width;

  if (pointCount <= 0) {
    const cursorX = yAxisWidth + margin.left;
    return {
      index: 0,
      cursorX,
      relativeX: 0,
      containerWidth,
      plotWidth: 0,
    };
  }

  const plotLeft = rect.left + yAxisWidth + margin.left;
  const plotRight = rect.right - margin.right;
  const plotWidth = plotRight - plotLeft;

  if (plotWidth <= 0) {
    const cursorX = yAxisWidth + margin.left;
    return {
      index: 0,
      cursorX,
      relativeX: 0,
      containerWidth,
      plotWidth: 0,
    };
  }

  const clampedX = Math.max(plotLeft, Math.min(plotRight, clientX));
  const relativeX = clampedX - plotLeft;
  const ratio = relativeX / plotWidth;
  const maxIndex = Math.max(0, pointCount - 1);
  const index = Math.round(ratio * maxIndex);
  const snappedX =
    plotLeft + (maxIndex > 0 ? (index / maxIndex) * plotWidth : 0);
  const cursorX = snappedX - rect.left;

  return {
    index,
    cursorX,
    relativeX,
    containerWidth,
    plotWidth,
  };
}
