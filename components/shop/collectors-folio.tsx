"use client";

import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrency } from "./currency-provider";

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
    const prefilled = `Hello,\n\nI would like to ask about these pieces:\n\n${pieceList}\n\nPlease let me know if they are still available, and about delivery or collection.`;

    // Find the message field on this page, or go to the enquiry form on the home page
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
        router.push("/#inquire");
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Saved pieces">
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
            <h2 className="display-wide text-xl">Saved pieces</h2>
            <p className="caption text-xs text-ink-soft">
              {items.length === 1 ? "1 piece saved" : `${items.length} pieces saved`}
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
              <p className="font-serif italic text-lg text-ink-soft">Nothing saved yet.</p>
              <p className="text-xs text-ink-soft max-w-xs mt-1">
                Tap &ldquo;Save&rdquo; on any piece to keep it here, then ask about them all in one note.
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
                            Pay link ↗
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
              <span className="caption text-sm">Total of priced pieces</span>
              <span className="nums text-xl font-bold">{formattedTotal ?? "—"}</span>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleInquireAll}
                className="btn btn-pour w-full text-center min-h-11 cursor-pointer"
              >
                Ask about these pieces ({items.length})
              </button>
              <button
                type="button"
                onClick={clear}
                className="w-full text-center text-xs text-ink-soft hover:text-ink cursor-pointer py-1"
              >
                Clear saved pieces
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
