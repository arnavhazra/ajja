"use client";

import React from "react";
import { CurrencyProvider } from "./currency-provider";
import { FolioProvider } from "./collectors-folio";
import { DossierProvider } from "./dossier-modal";

export function ShopProviders({ children, location = "" }: { children: React.ReactNode; location?: string }) {
  return (
    <CurrencyProvider>
      <FolioProvider>
        <DossierProvider location={location}>{children}</DossierProvider>
      </FolioProvider>
    </CurrencyProvider>
  );
}
