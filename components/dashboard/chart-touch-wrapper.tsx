"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Minimum horizontal movement before treating a touch as chart scrubbing. */
const HORIZONTAL_SCRUB_PX = 6;

type ChartTouchWrapperProps = {
  className?: string;
  children: ReactNode;
};

/**
 * Wraps chart plot areas for mobile touch: allows vertical page scroll by default,
 * blocks scroll only during primarily-horizontal drags, and never steals pointer
 * capture from Recharts.
 */
export function ChartTouchWrapper({
  className = "",
  children,
}: ChartTouchWrapperProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const scrubbingRef = useRef(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const reset = () => {
      startRef.current = null;
      scrubbingRef.current = false;
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      startRef.current = { x: touch.clientX, y: touch.clientY };
      scrubbingRef.current = false;
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

      if (scrubbingRef.current) {
        event.preventDefault();
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", reset, { passive: true });
    el.addEventListener("touchcancel", reset, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", reset);
      el.removeEventListener("touchcancel", reset);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`${className} w-full min-w-0 touch-pan-y overscroll-contain`}
    >
      {children}
    </div>
  );
}

/** @deprecated Use ChartTouchWrapper */
export { ChartTouchWrapper as ChartWrapper };

/** Recharts axis tooltip defaults for mobile scrub + desktop hover */
export const CHART_AXIS_TOOLTIP = {
  trigger: "axis" as const,
  isAnimationActive: false,
};

export const CHART_LINE_ACTIVE_DOT = {
  r: 3,
  strokeWidth: 0,
};
