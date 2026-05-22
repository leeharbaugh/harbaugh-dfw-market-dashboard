"use client";

import { useEffect, useRef, type ReactNode } from "react";

const HORIZONTAL_SCROLL_LOCK_PX = 6;

type ChartScrollLockWrapperProps = {
  className?: string;
  children: ReactNode;
};

/**
 * Prevents page scroll during primarily-horizontal touch drags on chart plot areas.
 * Vertical gestures still scroll the page normally.
 */
export function ChartScrollLockWrapper({
  className = "",
  children,
}: ChartScrollLockWrapperProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const lockScrollRef = useRef(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const reset = () => {
      startRef.current = null;
      lockScrollRef.current = false;
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      startRef.current = { x: touch.clientX, y: touch.clientY };
      lockScrollRef.current = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1 || !startRef.current) return;

      const touch = event.touches[0];
      const deltaX = touch.clientX - startRef.current.x;
      const deltaY = touch.clientY - startRef.current.y;

      if (
        Math.abs(deltaX) > HORIZONTAL_SCROLL_LOCK_PX &&
        Math.abs(deltaX) > Math.abs(deltaY)
      ) {
        lockScrollRef.current = true;
      }

      if (lockScrollRef.current) {
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
      className={`${className} w-full min-w-0 touch-pan-y overscroll-contain`.trim()}
    >
      {children}
    </div>
  );
}
