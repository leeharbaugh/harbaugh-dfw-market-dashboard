"use client";

import { useEffect, useState } from "react";

export function useChartMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

export function ChartPlaceholder() {
  return (
    <div className="h-full w-full rounded-md bg-stone-100/50" aria-hidden />
  );
}
