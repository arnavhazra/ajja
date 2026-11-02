"use client";

import { useSaved } from "./saved-context";
import { cn } from "@/lib/cn";

export function SaveButton({ slug, className }: { slug: string; className?: string }) {
  const { isSaved, toggleSave } = useSaved();
  const saved = isSaved(slug);
  return (
    <button
      type="button"
      onClick={() => toggleSave(slug)}
      aria-pressed={saved}
      className={cn(
        "inline-flex min-h-[44px] items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors",
        saved ? "text-terracotta" : "text-umber hover:text-ink",
        className,
      )}
    >
      <span aria-hidden="true">{saved ? "−" : "+"}</span> {saved ? "Saved" : "Save"}
    </button>
  );
}
