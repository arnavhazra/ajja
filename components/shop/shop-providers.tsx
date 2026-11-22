"use client";

import React from "react";
import { FolioProvider } from "./collectors-folio";

export function ShopProviders({ children }: { children: React.ReactNode }) {
  return <FolioProvider>{children}</FolioProvider>;
}
