"use client";

import { useEffect, useSyncExternalStore } from "react";

const SIZES = [
  { id: "sm", label: "Smaller text" },
  { id: "md", label: "Larger text" },
  { id: "lg", label: "Largest text" },
] as const;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function TextControls() {
  const size = useSyncExternalStore(subscribe, () => localStorage.getItem("ajja-text") || "sm", () => "sm");
  const contrast = useSyncExternalStore(subscribe, () => localStorage.getItem("ajja-contrast") === "high", () => false);

  useEffect(() => {
    const stored = localStorage.getItem("ajja-text") || "sm";
    if (stored === "sm") delete document.documentElement.dataset.text;
    else document.documentElement.dataset.text = stored;
  }, [size]);

  useEffect(() => {
    if (localStorage.getItem("ajja-contrast") === "high") document.documentElement.dataset.contrast = "high";
    else delete document.documentElement.dataset.contrast;
  }, [contrast]);

  function choose(next: string) {
    localStorage.setItem("ajja-text", next === "sm" ? "" : next);
    emit();
  }

  function toggleContrast() {
    localStorage.setItem("ajja-contrast", contrast ? "" : "high");
    emit();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1" role="group" aria-label="Text size">
        {SIZES.map((item) => (
          <button
            key={item.id}
            type="button"
            className="control px-3"
            aria-pressed={size === item.id}
            aria-label={item.label}
            onClick={() => choose(item.id)}
          >
            <span style={{ fontSize: item.id === "lg" ? "1.25rem" : item.id === "md" ? "1.05rem" : "0.9rem" }}>A</span>
          </button>
        ))}
      </div>
      <button type="button" className="control px-3" aria-pressed={contrast} onClick={toggleContrast}>
        {contrast ? "Standard contrast" : "Higher contrast"}
      </button>
    </div>
  );
}
