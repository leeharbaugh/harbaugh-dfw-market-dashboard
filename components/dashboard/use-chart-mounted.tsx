"use client";

import { useSyncExternalStore } from "react";

// Returns `false` during SSR and the first hydration render, then `true`
// once the client takes over. Charts use this to skip a mismatching
// initial render. Implemented via `useSyncExternalStore` (instead of
// `useEffect` + `setState`) so it doesn't trigger a cascading render.

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function useChartMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
}

export function ChartPlaceholder() {
  return (
    <div className="h-full w-full rounded-md bg-stone-100/50" aria-hidden />
  );
}
