"use client";

import { createContext, useContext } from "react";

type ChartTouchContextValue = {
  touchActive: boolean;
};

const ChartTouchContext = createContext<ChartTouchContextValue>({
  touchActive: false,
});

export function ChartTouchProvider({
  touchActive,
  children,
}: {
  touchActive: boolean;
  children: React.ReactNode;
}) {
  return (
    <ChartTouchContext.Provider value={{ touchActive }}>
      {children}
    </ChartTouchContext.Provider>
  );
}

export function useChartTouchActive() {
  return useContext(ChartTouchContext).touchActive;
}
