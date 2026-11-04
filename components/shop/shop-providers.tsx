"use client";

import React from "react";
import { CurrencyProvider } from "./currency-provider";
import { FolioProvider } from "./collectors-folio";

export function ShopProviders({ children }: { children: React.ReactNode }) {
  return (
    <CurrencyProvider>
      <FolioProvider>{children}</FolioProvider>
    </CurrencyProvider>
  );
}
