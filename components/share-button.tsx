"use client";

import { useState } from "react";

export function ShareButton({ label }: { label: string }) {
  const [note, setNote] = useState("");

  async function share() {
    const url = window.location.href;
    const data = { title: label, text: label, url };
    try {
      if (navigator.share) {
        await navigator.share(data);
      } else {
        await navigator.clipboard.writeText(url);
        setNote("Link copied.");
      }
      navigator.sendBeacon?.("/api/events", JSON.stringify({ type: "share", path: location.pathname }));
    } catch {
      // user dismissed the share sheet
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        className="inline-flex min-h-[44px] items-center rounded-sm bg-linen px-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ink hairline-box transition-colors hover:bg-ink hover:text-linen"
        onClick={() => void share()}
      >
        Share
      </button>
      {note ? (
        <span role="status" className="font-mono text-[10px] uppercase tracking-[0.2em] text-terracotta">
          {note}
        </span>
      ) : null}
    </span>
  );
}
