"use client";

import { useEffect } from "react";

export function EventBeacon({ type, productId, term }: { type: string; productId?: string; term?: string }) {
  useEffect(() => {
    const body = JSON.stringify({ type, productId, path: window.location.pathname, term });
    void fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body });
  }, [type, productId, term]);
  return null;
}
