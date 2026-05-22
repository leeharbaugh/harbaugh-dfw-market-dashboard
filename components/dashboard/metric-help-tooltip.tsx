"use client";

type MetricHelpTooltipProps = {
  text: string;
  label?: string;
};

export function MetricHelpTooltip({
  text,
  label = "About this metric",
}: MetricHelpTooltipProps) {
  return (
    <span className="relative z-30 inline-flex shrink-0 align-middle">
      <button
        type="button"
        aria-label={label}
        className="peer inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-stone-300/80 bg-stone-100/80 text-[0.55rem] font-semibold leading-none text-stone-500 transition-colors hover:border-stone-400 hover:bg-stone-50 hover:text-stone-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400/70"
      >
        ?
      </button>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute bottom-full left-1/2 z-[200] mb-2 w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-stone-200/90 bg-[#faf8f5] px-2.5 py-2 text-left text-[0.65rem] font-normal normal-case leading-snug tracking-normal text-stone-600 opacity-0 shadow-md shadow-stone-900/10 ring-1 ring-stone-900/[0.04] transition-opacity duration-150 peer-hover:visible peer-hover:opacity-100 peer-focus-visible:visible peer-focus-visible:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
