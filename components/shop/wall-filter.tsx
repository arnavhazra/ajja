"use client";

import React, { createContext, useContext, useState } from "react";
import { deltaE } from "@/lib/pigment-math";

interface WallFilterValue {
  /** Hex pigment the pigment shelf is filtering by, or null. */
  pigment: string | null;
  setPigment: (hex: string | null) => void;
  /** True when the product's pigment is close to the shelf pick. */
  matches: (productPigment: string) => boolean;
}

const WallFilterContext = createContext<WallFilterValue>({
  pigment: null,
  setPigment: () => {},
  matches: () => true,
});

const NEAR = 30; // ΔE neighbourhood — a shelf jar colours a family, not a pixel.

export function WallFilterProvider({ children }: { children: React.ReactNode }) {
  const [pigment, setPigment] = useState<string | null>(null);
  const matches = (productPigment: string) => !pigment || deltaE(pigment, productPigment) < NEAR;
  return <WallFilterContext.Provider value={{ pigment, setPigment, matches }}>{children}</WallFilterContext.Provider>;
}

export function useWallFilter() {
  return useContext(WallFilterContext);
}
