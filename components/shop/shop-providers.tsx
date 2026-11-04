"use client";

import React from "react";
import { CurrencyProvider } from "./currency-provider";
import { FolioProvider } from "./collectors-folio";
import { DossierProvider } from "./dossier-modal";

export function ShopProviders({ children }: { children: React.ReactNode }) {
  return (
    <CurrencyProvider>
      <FolioProvider>
        <DossierProvider>{children}</DossierProvider>
      </FolioProvider>
    </CurrencyProvider>
  );
}
