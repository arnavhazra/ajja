"use client";

import React, { createContext, useContext, useSyncExternalStore } from "react";

export type CurrencyCode = "USD" | "INR" | "EUR" | "GBP";

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  format: (minor: number | null) => string | null;
  convertMinor: (minor: number | null) => number | null;
}

const RATES: Record<CurrencyCode, number> = {
  USD: 1.0,
  INR: 86.5,
  EUR: 0.92,
  GBP: 0.79,
};

const LOCALES: Record<CurrencyCode, string> = {
  USD: "en-US",
  INR: "en-IN",
  EUR: "fr-FR",
  GBP: "en-GB",
};

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "USD",
  setCurrency: () => {},
  format: (minor) => (minor != null ? `$${(minor / 100).toFixed(2)}` : null),
  convertMinor: (minor) => minor,
});

let currentCurrency: CurrencyCode = "USD";
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): CurrencyCode {
  if (typeof window === "undefined") return "USD";
  try {
    const saved = localStorage.getItem("ajja_currency") as CurrencyCode | null;
    if (saved && RATES[saved]) {
      currentCurrency = saved;
      return saved;
    }
  } catch {
    // ignore
  }
  return currentCurrency;
}

function getServerSnapshot(): CurrencyCode {
  return "USD";
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const currency = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setCurrency = (code: CurrencyCode) => {
    currentCurrency = code;
    try {
      localStorage.setItem("ajja_currency", code);
    } catch {
      // ignore
    }
    listeners.forEach((l) => l());
  };

  const convertMinor = (minor: number | null): number | null => {
    if (minor == null) return null;
    const rate = RATES[currency] ?? 1.0;
    return Math.round(minor * rate);
  };

  const format = (minor: number | null): string | null => {
    if (minor == null) return null;
    const rate = RATES[currency] ?? 1.0;
    const converted = (minor / 100) * rate;
    const locale = LOCALES[currency] ?? "en-US";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "INR" ? 0 : 0,
    }).format(converted);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, format, convertMinor }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

export function CurrencySelector({ className }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();
  const codes: CurrencyCode[] = ["USD", "INR", "EUR", "GBP"];

  return (
    <div
      className={`inline-flex items-center rounded-full border border-line bg-gesso/70 p-0.5 text-xs font-mono backdrop-blur-sm ${className ?? ""}`}
      role="group"
      aria-label="Currency selection"
    >
      {codes.map((code) => {
        const active = currency === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setCurrency(code)}
            aria-pressed={active}
            className={`rounded-full px-2 py-0.5 transition-colors cursor-pointer ${
              active
                ? "bg-ink font-semibold text-gesso"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
