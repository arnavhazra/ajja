"use client";

import { useCurrency } from "./currency-provider";

export function DynamicPrice({
  priceMinor,
  fallback,
  sold = false,
  className,
}: {
  priceMinor: number | null;
  fallback: string;
  sold?: boolean;
  className?: string;
}) {
  const { format } = useCurrency();
  if (sold) return <span className="text-sold">Sold</span>;
  const formatted = format(priceMinor);
  return <span className={className}>{formatted ?? fallback}</span>;
}
