"use client";

import React from "react";
import { FolioDrawer } from "./folio-drawer";
import { FolioStateProvider } from "./folio-store";

export function FolioProvider({ children }: { children: React.ReactNode }) {
  return (
    <FolioStateProvider>
      {children}
      <FolioDrawer />
    </FolioStateProvider>
  );
}

export { useFolio } from "./folio-store";
export type { FolioItem } from "./folio-store";
