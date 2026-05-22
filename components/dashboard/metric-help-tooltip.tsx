"use client";

import { useEffect, useId, useRef, useState } from "react";

type MetricHelpTooltipProps = {
  text: string;
  metricName: string;
};

export function MetricHelpTooltip({ text, metricName }: MetricHelpTooltipProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <span
      ref={rootRef}
      className="relative z-30 inline-flex shrink-0 overflow-visible align-middle"
    >
      <button
        type="button"
        aria-label={`Show description for ${metricName}`}
        aria-expanded={open}
        aria-controls={tooltipId}
        onClick={() => setOpen((prev) => !prev)}
        className="peer inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-stone-300/80 bg-stone-100/80 text-[0.55rem] font-semibold leading-none text-stone-500 transition-colors hover:border-stone-400 hover:bg-stone-50 hover:text-stone-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400/70"
      >
        ?
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className={`pointer-events-none absolute bottom-full left-1/2 z-[200] mb-2 w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-stone-200/90 bg-[#faf8f5] px-2.5 py-2 text-left text-[0.65rem] font-normal normal-case leading-snug tracking-normal text-stone-800 shadow-md shadow-stone-900/10 ring-1 ring-stone-900/[0.04] transition-opacity duration-150 ${
          open
            ? "visible opacity-100"
            : "invisible opacity-0 [@media(hover:hover)]:peer-hover:visible [@media(hover:hover)]:peer-hover:opacity-100 [@media(hover:hover)]:peer-focus-visible:visible [@media(hover:hover)]:peer-focus-visible:opacity-100"
        }`}
      >
        {text}
      </span>
    </span>
  );
}
