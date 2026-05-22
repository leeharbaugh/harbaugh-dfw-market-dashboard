"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type TouchEvent,
} from "react";
import { ChartTouchProvider } from "@/components/dashboard/chart-touch-context";
import { MobileChartTooltip } from "@/components/dashboard/mobile-chart-tooltip";
import {
  resolveChartTouchIndex,
  type ChartPlotMargin,
  type ChartTouchResolution,
} from "@/lib/chart-touch-geometry";
import { formatTooltipValue } from "@/lib/format-metric";
import type { ValueFormat } from "@/lib/dfw-dashboard-sample-data";

/** Temporary: mobile touch diagnostics — remove when tooltips are verified. */
const CHART_TOUCH_DEBUG = true;

const HORIZONTAL_SCRUB_PX = 6;

export type TouchTooltipEntry = {
  name?: string;
  value: number;
  color?: string;
};

export type ChartTouchTooltipConfig = {
  labels: string[];
  format: ValueFormat;
  formatSecondary?: ValueFormat;
  getEntries: (index: number) => TouchTooltipEntry[];
  margin: ChartPlotMargin;
  yAxisWidth: number;
};

type ChartTouchWrapperProps = {
  className?: string;
  children: ReactNode;
  tooltip: ChartTouchTooltipConfig;
};

type TouchDebugState = {
  lastEvent: string;
  clientX: number;
  clientY: number;
  containerWidth: number;
  relativeX: number;
  index: number;
};

function isTouchPointer(pointerType: string) {
  return pointerType === "touch" || pointerType === "pen";
}

function logTouchDebug(
  eventType: string,
  clientX: number,
  clientY: number,
  resolution: ChartTouchResolution,
) {
  if (!CHART_TOUCH_DEBUG) return;
  console.log("[chart-touch]", {
    eventType,
    clientX,
    clientY,
    containerWidth: resolution.containerWidth,
    relativeX: Math.round(resolution.relativeX),
    nearestIndex: resolution.index,
    plotWidth: Math.round(resolution.plotWidth),
  });
}

export function ChartTouchWrapper({
  className = "",
  children,
  tooltip,
}: ChartTouchWrapperProps) {
  const { labels, format, formatSecondary, getEntries, margin, yAxisWidth } =
    tooltip;

  const rootRef = useRef<HTMLDivElement>(null);
  const touchLayerRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const scrubbingRef = useRef(false);
  const touchActiveRef = useRef(false);

  const [touchActive, setTouchActive] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [cursorX, setCursorX] = useState(0);
  const [debug, setDebug] = useState<TouchDebugState | null>(null);

  const setTouchActiveState = useCallback((value: boolean) => {
    touchActiveRef.current = value;
    setTouchActive(value);
  }, []);

  const resolveFromClientX = useCallback(
    (clientX: number, clientY: number, eventType: string) => {
      const el = rootRef.current;
      if (!el || labels.length === 0) return null;

      const resolution = resolveChartTouchIndex(clientX, el.getBoundingClientRect(), {
        pointCount: labels.length,
        margin,
        yAxisWidth,
      });

      logTouchDebug(eventType, clientX, clientY, resolution);

      if (CHART_TOUCH_DEBUG) {
        setDebug({
          lastEvent: eventType,
          clientX,
          clientY,
          containerWidth: resolution.containerWidth,
          relativeX: resolution.relativeX,
          index: resolution.index,
        });
      }

      setActiveIndex(resolution.index);
      setCursorX(resolution.cursorX);
      return resolution;
    },
    [
      labels.length,
      margin.bottom,
      margin.left,
      margin.right,
      margin.top,
      yAxisWidth,
    ],
  );

  const releaseTouch = useCallback(() => {
    startRef.current = null;
    scrubbingRef.current = false;
    setTouchActiveState(false);
    setActiveIndex(null);
    if (CHART_TOUCH_DEBUG) {
      setDebug((prev) =>
        prev ? { ...prev, lastEvent: "release" } : null,
      );
    }
  }, [setTouchActiveState]);

  const beginTouch = useCallback(
    (clientX: number, clientY: number, eventType: string) => {
      startRef.current = { x: clientX, y: clientY };
      scrubbingRef.current = false;
      setTouchActiveState(true);
      resolveFromClientX(clientX, clientY, eventType);
    },
    [resolveFromClientX, setTouchActiveState],
  );

  const moveTouch = useCallback(
    (clientX: number, clientY: number, eventType: string) => {
      if (!touchActiveRef.current && !startRef.current) return;

      const deltaX = startRef.current
        ? clientX - startRef.current.x
        : 0;
      const deltaY = startRef.current
        ? clientY - startRef.current.y
        : 0;

      if (
        startRef.current &&
        Math.abs(deltaX) > HORIZONTAL_SCRUB_PX &&
        Math.abs(deltaX) > Math.abs(deltaY)
      ) {
        scrubbingRef.current = true;
      }

      resolveFromClientX(clientX, clientY, eventType);
    },
    [resolveFromClientX],
  );

  const maybePreventScroll = useCallback((event: TouchEvent) => {
    if (scrubbingRef.current) {
      event.preventDefault();
    }
  }, []);

  const onTouchLayerTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    beginTouch(touch.clientX, touch.clientY, "touchstart");
  };

  const onTouchLayerTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    moveTouch(touch.clientX, touch.clientY, "touchmove");
    maybePreventScroll(event);
  };

  const onTouchLayerTouchEnd = () => {
    releaseTouch();
  };

  const onTouchLayerPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!isTouchPointer(event.pointerType)) return;
    beginTouch(event.clientX, event.clientY, "pointerdown");
  };

  const onTouchLayerPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isTouchPointer(event.pointerType)) return;
    moveTouch(event.clientX, event.clientY, "pointermove");
  };

  const onTouchLayerPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!isTouchPointer(event.pointerType)) return;
    // Touchend releases touch state; pointerup on mobile can fire early and hide the tooltip.
  };

  const onTouchLayerClick = (event: MouseEvent<HTMLDivElement>) => {
    const el = rootRef.current;
    const resolution = el
      ? resolveChartTouchIndex(event.clientX, el.getBoundingClientRect(), {
          pointCount: labels.length,
          margin,
          yAxisWidth,
        })
      : null;

    if (CHART_TOUCH_DEBUG) {
      console.log("[chart-touch]", {
        eventType: "click",
        clientX: event.clientX,
        clientY: event.clientY,
        containerWidth: resolution?.containerWidth,
        relativeX: resolution ? Math.round(resolution.relativeX) : null,
        nearestIndex: resolution?.index,
      });
    }

    if (resolution) {
      beginTouch(event.clientX, event.clientY, "click");
    }
  };

  useEffect(() => {
    const layer = touchLayerRef.current;
    if (!layer || !CHART_TOUCH_DEBUG) return;

    const rect = rootRef.current?.getBoundingClientRect();
    console.log("[chart-touch] mount", {
      rootWidth: rect?.width,
      rootHeight: rect?.height,
      layerPointerEvents: getComputedStyle(layer).pointerEvents,
      layerZIndex: getComputedStyle(layer).zIndex,
      labelCount: labels.length,
    });
  }, [labels.length]);

  const activeMobileTooltip =
    touchActive &&
    activeIndex != null &&
    activeIndex >= 0 &&
    activeIndex < labels.length;

  const mobileEntries =
    activeMobileTooltip ? getEntries(activeIndex) : [];

  const activeLabel = activeMobileTooltip
    ? (labels[activeIndex] ?? "—")
    : "—";

  const primaryEntry = mobileEntries[0];
  const debugValue =
    primaryEntry != null
      ? formatTooltipValue(primaryEntry.value, format)
      : "—";

  const containerWidth = rootRef.current?.clientWidth ?? 200;
  const tooltipTop = margin.top + 4;
  const tooltipLeft = activeMobileTooltip
    ? Math.max(4, Math.min(cursorX - 48, containerWidth - 148))
    : containerWidth / 2 - 60;
  /** While debugging: top-center so the box is impossible to miss. */
  const tooltipPosition = CHART_TOUCH_DEBUG
    ? {
        left: "50%",
        top: tooltipTop,
        transform: "translateX(-50%)",
      }
    : {
        left: tooltipLeft,
        top: tooltipTop,
      };

  useEffect(() => {
    if (!CHART_TOUCH_DEBUG || !activeMobileTooltip) return;
    console.log("[chart-touch] tooltip render", {
      activeMobileTooltip,
      activeIndex,
      label: activeLabel,
      value: debugValue,
      tooltipPosition,
      cursorX,
      entryCount: mobileEntries.length,
    });
  }, [
    activeMobileTooltip,
    activeIndex,
    activeLabel,
    debugValue,
    tooltipPosition,
    cursorX,
    mobileEntries.length,
  ]);

  return (
    <ChartTouchProvider touchActive={touchActive}>
      <div
        ref={rootRef}
        className={`relative overflow-visible ${className} w-full min-w-0`}
      >
        <div className="relative h-full w-full min-h-0 overflow-visible">
          {children}
        </div>

        {/* Captures touch on hover-none devices; desktop hover passes through to Recharts */}
        <div
          ref={touchLayerRef}
          className="absolute inset-0 z-20 touch-pan-y overscroll-contain [@media(hover:hover)_and_(pointer:fine)]:pointer-events-none"
          aria-hidden
          onTouchStart={onTouchLayerTouchStart}
          onTouchMove={onTouchLayerTouchMove}
          onTouchEnd={onTouchLayerTouchEnd}
          onTouchCancel={onTouchLayerTouchEnd}
          onPointerDown={onTouchLayerPointerDown}
          onPointerMove={onTouchLayerPointerMove}
          onPointerUp={onTouchLayerPointerUp}
          onPointerCancel={onTouchLayerPointerUp}
          onClick={onTouchLayerClick}
        />

        {activeMobileTooltip ? (
          <div
            className="pointer-events-none absolute inset-0 z-[9999] overflow-visible"
            aria-hidden
          >
            <div
              className="absolute w-px bg-[#d6d3d1]"
              style={{
                left: cursorX,
                top: margin.top,
                bottom: margin.bottom,
              }}
            />
            <div
              className="absolute z-[9999] max-w-[10rem]"
              style={tooltipPosition}
            >
              <MobileChartTooltip
                label={activeLabel}
                entries={
                  mobileEntries.length > 0
                    ? mobileEntries
                    : [{ value: 0, name: "Value" }]
                }
                format={format}
                formatSecondary={formatSecondary}
              />
            </div>
          </div>
        ) : null}

        {CHART_TOUCH_DEBUG ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-40 bg-stone-900/75 px-1.5 py-1 font-mono text-[0.55rem] leading-tight text-amber-100 [@media(hover:hover)_and_(pointer:fine)]:hidden"
            aria-live="polite"
          >
            {debug ? (
              <>
                <span className="block">
                  {debug.lastEvent} · x={Math.round(debug.clientX)} · relX=
                  {Math.round(debug.relativeX)} · w=
                  {Math.round(debug.containerWidth)}
                </span>
                <span className="block">
                  Touch index: {debug.index} / Date: {activeLabel} / Value:{" "}
                  {debugValue} / tooltip:{" "}
                  {activeMobileTooltip ? "ON" : "OFF"}
                </span>
              </>
            ) : (
              <span className="block">Touch chart — waiting for event…</span>
            )}
          </div>
        ) : null}
      </div>
    </ChartTouchProvider>
  );
}

/** @deprecated Use ChartTouchWrapper */
export { ChartTouchWrapper as ChartWrapper };

/** Recharts tooltip defaults for desktop hover */
export const CHART_AXIS_TOOLTIP = {
  isAnimationActive: false,
};

export const CHART_LINE_ACTIVE_DOT = {
  r: 3,
  strokeWidth: 0,
};
