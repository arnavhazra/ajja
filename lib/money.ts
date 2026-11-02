export function dollarsToMinor(input: string): number | null {
  const trimmed = input.trim().replace(/[$,]/g, "");
  if (!trimmed) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new Error("Enter a price like 40 or 40.00, or leave it blank.");
  }
  const [dollars, cents = ""] = trimmed.split(".");
  return Number(dollars) * 100 + Number(cents.padEnd(2, "0"));
}

export function minorToDollars(minor: number | null): string {
  if (minor == null) return "";
  return (minor / 100).toFixed(2);
}

export function formatMoney(minor: number | null, currency = "USD"): string | null {
  if (minor == null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
  }).format(minor / 100);
}
