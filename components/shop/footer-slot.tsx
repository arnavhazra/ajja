"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * The home page hangs its own night footer (PourFooter); every other shop page
 * keeps the standard SiteFooter. Layouts cannot read the pathname on the server,
 * so the slot decides on the client.
 */
export function FooterSlot({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <>{children}</>;
}
