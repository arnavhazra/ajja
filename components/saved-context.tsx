"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { SavedDrawer, type SavedItem } from "./saved-drawer";

const STORAGE_KEY = "ajja-saved";

type SavedContextValue = {
  savedSlugs: string[];
  isSaved: (slug: string) => boolean;
  toggleSave: (slug: string) => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const SavedContext = createContext<SavedContextValue | null>(null);

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSaved must be used inside SavedProvider");
  return ctx;
}

function readStored(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function SavedProvider({ children }: { children: ReactNode }) {
  const [savedSlugs, setSavedSlugs] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : readStored(),
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fetched, setFetched] = useState<{ key: string; items: SavedItem[] }>({ key: "", items: [] });

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setSavedSlugs(readStored());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleSave = useCallback((slug: string) => {
    setSavedSlugs((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // storage may be unavailable; keep in-memory state
      }
      try {
        navigator.sendBeacon?.("/api/events", JSON.stringify({ type: prev.includes(slug) ? "unsave" : "save", slug }));
      } catch {
        // beacon is best-effort
      }
      return next;
    });
  }, []);

  const isSaved = useCallback((slug: string) => savedSlugs.includes(slug), [savedSlugs]);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const slugsKey = savedSlugs.join(",");
  useEffect(() => {
    if (!drawerOpen || !savedSlugs.length) return;
    let cancelled = false;
    fetch(`/api/saved?slugs=${encodeURIComponent(slugsKey)}`)
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items?: SavedItem[] }) => {
        if (!cancelled) setFetched({ key: slugsKey, items: Array.isArray(data.items) ? data.items : [] });
      })
      .catch(() => {
        if (!cancelled) setFetched({ key: slugsKey, items: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [drawerOpen, slugsKey, savedSlugs.length]);

  const loaded = fetched.key === slugsKey;
  const items = loaded ? fetched.items : [];

  const value = useMemo<SavedContextValue>(
    () => ({ savedSlugs, isSaved, toggleSave, drawerOpen, openDrawer, closeDrawer }),
    [savedSlugs, isSaved, toggleSave, drawerOpen, openDrawer, closeDrawer],
  );

  return (
    <SavedContext.Provider value={value}>
      {children}
      <SavedDrawer
        items={items}
        savedSlugs={savedSlugs}
        loading={drawerOpen && savedSlugs.length > 0 && !loaded}
        isOpen={drawerOpen}
        onClose={closeDrawer}
        onToggleSave={toggleSave}
      />
    </SavedContext.Provider>
  );
}
