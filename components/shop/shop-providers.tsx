"use client";

import React from "react";
import { CurrencyProvider } from "./currency-provider";
import { FolioProvider } from "./collectors-folio";
import { DossierProvider } from "./dossier-modal";
import { WallFilterProvider } from "./wall-filter";

export function ShopProviders({ children, location = "" }: { children: React.ReactNode; location?: string }) {
  return (
    <CurrencyProvider>
      <FolioProvider>
        <DossierProvider location={location}>
          <WallFilterProvider>{children}</WallFilterProvider>
        </DossierProvider>
      </FolioProvider>
    </CurrencyProvider>
  );
}
