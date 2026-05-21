import type { MetricDataStatus } from "@/lib/dfw-dashboard-sample-data";

const BADGE_STYLES: Record<
  MetricDataStatus,
  { label: string; className: string }
> = {
  live: {
    label: "Live",
    className:
      "border-stone-200/90 bg-stone-100/80 text-stone-600",
  },
  fallback: {
    label: "Fallback",
    className:
      "border-stone-200/80 bg-stone-50/90 text-stone-400",
  },
  error: {
    label: "Error",
    className:
      "border-amber-200/80 bg-amber-50/90 text-amber-800/80",
  },
};

type DataStatusBadgeProps = {
  status: MetricDataStatus;
  title?: string;
};

export function DataStatusBadge({ status, title }: DataStatusBadgeProps) {
  const { label, className } = BADGE_STYLES[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.08em] ${className}`}
      title={title}
    >
      {label}
    </span>
  );
}
