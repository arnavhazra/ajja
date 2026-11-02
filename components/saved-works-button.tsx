"use client";

import { useSaved } from "./saved-context";

export function SavedWorksButton() {
  const { savedSlugs, openDrawer } = useSaved();
  return (
    <button
      type="button"
      onClick={openDrawer}
      className="inline-flex min-h-[44px] items-center gap-2 rounded-sm hairline-box bg-linen px-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ink transition-colors hover:bg-ink hover:text-linen"
      aria-label={`Open saved works (${savedSlugs.length})`}
    >
      Saved
      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-terracotta px-1 font-bold text-linen">
        {savedSlugs.length}
      </span>
    </button>
  );
}
