"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";

const SCRUB_THRESHOLD_PX = 8;

function isTouchPointer(pointerType: string) {
  return pointerType === "touch" || pointerType === "pen";
}

type ChartWrapperProps = {
  className?: string;
  children: ReactNode;
};

export function ChartWrapper({ className = "", children }: ChartWrapperProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const interactingRef = useRef(false);
  const [interacting, setInteracting] = useState(false);

  const updateInteracting = useCallback((value: boolean) => {
    interactingRef.current = value;
    setInteracting(value);
  }, []);

  const releaseInteraction = useCallback(() => {
    startRef.current = null;
    updateInteracting(false);
  }, [updateInteracting]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const blockScrollWhileScrubbing = (event: TouchEvent) => {
      if (interactingRef.current) {
        event.preventDefault();
      }
    };

    el.addEventListener("touchmove", blockScrollWhileScrubbing, {
      passive: false,
    });
    return () => {
      el.removeEventListener("touchmove", blockScrollWhileScrubbing);
    };
  }, []);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!isTouchPointer(event.pointerType)) return;
    startRef.current = { x: event.clientX, y: event.clientY };
    updateInteracting(false);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isTouchPointer(event.pointerType) || !startRef.current) return;

    const dx = event.clientX - startRef.current.x;
    const dy = event.clientY - startRef.current.y;

    if (!interactingRef.current) {
      if (
        Math.abs(dx) >= SCRUB_THRESHOLD_PX &&
        Math.abs(dx) > Math.abs(dy)
      ) {
        updateInteracting(true);
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    }

    if (interactingRef.current) {
      event.preventDefault();
    }
  };

  const endPointerInteraction = (event: PointerEvent<HTMLDivElement>) => {
    if (!isTouchPointer(event.pointerType)) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    releaseInteraction();
  };

  return (
    <div
      ref={rootRef}
      className={`${className} w-full min-w-0 overscroll-contain ${
        interacting ? "touch-none" : "touch-pan-y"
      }`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointerInteraction}
      onPointerCancel={endPointerInteraction}
    >
      {children}
    </div>
  );
}
