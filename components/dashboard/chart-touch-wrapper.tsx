"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";
import { ChartTouchProvider } from "@/components/dashboard/chart-touch-context";
import {
  resolveChartTouchIndex,
  type ChartPlotMargin,
} from "@/lib/chart-touch-geometry";
import type { ValueFormat } from "@/lib/dfw-dashboard-sample-data";

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

function isTouchPointer(pointerType: string) {
  return pointerType === "touch" || pointerType === "pen";
}

export function ChartTouchWrapper({
  className = "",
  children,
  tooltip,
}: ChartTouchWrapperProps) {
  const { labels, format, formatSecondary, getEntries, margin, yAxisWidth } =
    tooltip;

  const rootRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const scrubbingRef = useRef(false);

  const [touchActive, setTouchActive] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [cursorX, setCursorX] = useState(0);

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const el = rootRef.current;
      if (!el || labels.length === 0) return;
      const { index, cursorX: nextCursorX } = resolveChartTouchIndex(
        clientX,
        el.getBoundingClientRect(),
        {
          pointCount: labels.length,
          margin,
          yAxisWidth,
        },
      );
      setActiveIndex(index);
      setCursorX(nextCursorX);
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
    setTouchActive(false);
    setActiveIndex(null);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      startRef.current = { x: touch.clientX, y: touch.clientY };
      scrubbingRef.current = false;
      setTouchActive(true);
      updateFromClientX(touch.clientX);
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1 || !startRef.current) return;

      const touch = event.touches[0];
      const deltaX = touch.clientX - startRef.current.x;
      const deltaY = touch.clientY - startRef.current.y;

      if (
        Math.abs(deltaX) > HORIZONTAL_SCRUB_PX &&
        Math.abs(deltaX) > Math.abs(deltaY)
      ) {
        scrubbingRef.current = true;
      }

      updateFromClientX(touch.clientX);

      if (scrubbingRef.current) {
        event.preventDefault();
      }
    };

    const onTouchEnd = () => releaseTouch();
    const onTouchCancel = () => releaseTouch();

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [releaseTouch, updateFromClientX]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!isTouchPointer(event.pointerType)) return;
    startRef.current = { x: event.clientX, y: event.clientY };
    scrubbingRef.current = false;
    setTouchActive(true);
    updateFromClientX(event.clientX);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isTouchPointer(event.pointerType) || !touchActive) return;

    const deltaX = startRef.current
      ? event.clientX - startRef.current.x
      : 0;
    const deltaY = startRef.current
      ? event.clientY - startRef.current.y
      : 0;

    if (
      startRef.current &&
      Math.abs(deltaX) > HORIZONTAL_SCRUB_PX &&
      Math.abs(deltaX) > Math.abs(deltaY)
    ) {
      scrubbingRef.current = true;
    }

    updateFromClientX(event.clientX);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!isTouchPointer(event.pointerType)) return;
    releaseTouch();
  };

  const mobilePayload =
    touchActive && activeIndex != null
      ? getEntries(activeIndex).map((entry) => ({
          value: entry.value,
          name: entry.name,
          color: entry.color,
        }))
      : [];

  const tooltipLeft =
    activeIndex != null
      ? Math.max(4, Math.min(cursorX - 40, (rootRef.current?.clientWidth ?? 200) - 140))
      : 0;

  return (
    <ChartTouchProvider touchActive={touchActive}>
      <div
        ref={rootRef}
        className={`relative ${className} w-full min-w-0 touch-pan-y overscroll-contain`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {children}

        {touchActive && activeIndex != null && labels[activeIndex] != null ? (
          <div
            className="pointer-events-none absolute inset-0 z-10"
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
              className="absolute max-w-[min(85%,10rem)]"
              style={{ left: tooltipLeft, top: margin.top + 4 }}
            >
              <ChartTooltip
                active
                label={labels[activeIndex]}
                payload={mobilePayload}
                format={format}
                formatSecondary={formatSecondary}
              />
            </div>
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
