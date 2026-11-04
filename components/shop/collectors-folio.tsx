"use client";

import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrency } from "./currency-provider";
import { cn } from "@/lib/cn";

export interface FolioItem {
  id: string;
  slug: string;
  title: string;
  priceMinor: number | null;
  imageUrl?: string;
  kind?: string;
  dimensions?: string;
  stripeUrl?: string;
}

interface FolioContextValue {
  items: FolioItem[];
  addItem: (item: FolioItem) => void;
  removeItem: (id: string) => void;
  toggleItem: (item: FolioItem) => void;
  hasItem: (id: string) => boolean;
  clear: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const STORAGE_KEY = "ajja_folio_v1";

let cachedItems: FolioItem[] = [];
let cachedRaw: string | null = null;
const listeners = new Set<() => void>();

function subscribeFolio(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getFolioSnapshot(): FolioItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedItems = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(cachedItems)) cachedItems = [];
    }
  } catch {
    cachedItems = [];
  }
  return cachedItems;
}

const EMPTY_ITEMS: FolioItem[] = [];

function getServerFolioSnapshot(): FolioItem[] {
  return EMPTY_ITEMS;
}

function emitChange(next: FolioItem[]) {
  cachedItems = next;
  try {
    const serialized = JSON.stringify(next);
    cachedRaw = serialized;
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
}

const FolioContext = createContext<FolioContextValue>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  toggleItem: () => {},
  hasItem: () => false,
  clear: () => {},
  isOpen: false,
  setIsOpen: () => {},
});

export function FolioProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribeFolio, getFolioSnapshot, getServerFolioSnapshot);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = (item: FolioItem) => {
    if (items.some((i) => i.id === item.id)) return;
    emitChange([...items, item]);
  };

  const removeItem = (id: string) => {
    emitChange(items.filter((i) => i.id !== id));
  };

  const toggleItem = (item: FolioItem) => {
    if (items.some((i) => i.id === item.id)) {
      removeItem(item.id);
    } else {
      addItem(item);
    }
  };

  const hasItem = (id: string) => items.some((i) => i.id === id);

  const clear = () => emitChange([]);

  return (
    <FolioContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        toggleItem,
        hasItem,
        clear,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
      <FolioDrawer />
    </FolioContext.Provider>
  );
}

export function useFolio() {
  return useContext(FolioContext);
}

export function FolioButton({ className }: { className?: string }) {
  const { items, setIsOpen } = useFolio();
  const count = items.length;

  return (
    <button
      type="button"
      onClick={() => setIsOpen(true)}
      className={cn(
        "group relative inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-gesso/70 px-3 text-xs font-mono backdrop-blur-sm transition-all duration-200 hover:border-line-strong cursor-pointer",
        count > 0 && "border-pour/50 bg-pour/5",
        className,
      )}
      aria-label={`Collector's folio, ${count} pieces shortlisted`}
    >
      <span className="font-semibold uppercase tracking-wider text-ink">Folio</span>
      <span
        className={cn(
          "inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold transition-transform",
          count > 0
            ? "bg-pour text-pour-ink scale-100"
            : "bg-plate text-ink-soft scale-90",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function FolioDrawer() {
  const { items, isOpen, setIsOpen, removeItem, clear } = useFolio();
  const { format } = useCurrency();
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  const totalMinor = items.reduce((sum, item) => sum + (item.priceMinor ?? 0), 0);
  const formattedTotal = format(totalMinor);

  const handleInquireAll = () => {
    setIsOpen(false);
    const pieceList = items
      .map((it) => `• ${it.title}${it.priceMinor ? ` (${format(it.priceMinor)})` : ""} — /p/${it.slug}`)
      .join("\n");
    const prefilled = `Hello Ajja,\n\nI would like to inquire about acquiring the following shortlisted works:\n\n${pieceList}\n\nPlease let me know about studio availability, provenance, and framing/shipping arrangements.`;

    // Try finding the textarea on current page or navigate to /#visit
    try {
      sessionStorage.setItem("ajja:enquiry-prefill", prefilled);
    } catch {}
    setTimeout(() => {
      const textarea = document.querySelector("textarea[name='message']") as HTMLTextAreaElement | null;
      if (textarea) {
        textarea.value = prefilled;
        textarea.scrollIntoView({ behavior: "smooth", block: "center" });
        textarea.focus();
        try {
          sessionStorage.removeItem("ajja:enquiry-prefill");
        } catch {}
      } else {
        router.push("/#visit");
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Collector's Folio">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-night/50 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative flex h-full w-full max-w-md flex-col bg-gesso shadow-2xl safe-bottom border-l border-line">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <h2 className="display-wide text-xl">Collector&apos;s Folio</h2>
            <p className="caption text-xs text-ink-soft">
              {items.length === 1 ? "1 piece shortlisted" : `${items.length} pieces shortlisted`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="btn btn-quiet min-h-9 px-3 text-sm cursor-pointer"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="inline-block size-3 rounded-full bg-pour/40 mb-3" />
              <p className="font-serif italic text-lg text-ink-soft">Your studio folio is empty.</p>
              <p className="text-xs text-ink-soft max-w-xs mt-1">
                Click &ldquo;+ Folio&rdquo; on any piece across the studio to curate works for a combined inquiry or acquisition.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 border-b border-line pb-4">
                  {item.imageUrl ? (
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-[2px] bg-plate">
                      <Image src={item.imageUrl} alt={item.title} fill sizes="80px" className="object-cover" />
                    </div>
                  ) : (
                    <div className="size-20 shrink-0 rounded-[2px] bg-plate" />
                  )}
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div>
                      <Link
                        href={`/p/${item.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="truncate block text-sm font-semibold hover:underline"
                      >
                        {item.title}
                      </Link>
                      {item.kind ? <p className="caption text-xs text-ink-soft truncate">{item.kind}</p> : null}
                      {item.dimensions ? <p className="font-mono text-[11px] text-ink-soft truncate">{item.dimensions}</p> : null}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="nums text-xs font-semibold text-ink">
                        {item.priceMinor ? format(item.priceMinor) : "Ask for price"}
                      </span>
                      <div className="flex items-center gap-2">
                        {item.stripeUrl ? (
                          <a
                            href={item.stripeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-mono text-cobalt hover:underline"
                          >
                            Stripe Pay ↗
                          </a>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-xs text-sold/80 hover:text-sold hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 ? (
          <div className="border-t border-line bg-plate/40 p-6 space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="caption text-sm">Estimated Total</span>
              <span className="nums text-xl font-bold">{formattedTotal ?? "Custom inquiry"}</span>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleInquireAll}
                className="btn btn-pour w-full text-center min-h-11 cursor-pointer"
              >
                Inquire on Shortlisted Works ({items.length})
              </button>
              <button
                type="button"
                onClick={clear}
                className="w-full text-center text-xs text-ink-soft hover:text-ink cursor-pointer py-1"
              >
                Clear folio
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
