"use client";

import React, { createContext, useContext, useSyncExternalStore, useState } from "react";

export interface FolioItem {
  id: string;
  slug: string;
  title: string;
  priceMinor: number | null;
  imageUrl?: string;
  kind?: string;
  dimensions?: string;
  status?: string;
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

export function getFolioSnapshot(): FolioItem[] {
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

export function emitChange(next: FolioItem[]) {
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

export function FolioStateProvider({ children }: { children: React.ReactNode }) {
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
    </FolioContext.Provider>
  );
}

export function useFolio() {
  return useContext(FolioContext);
}
