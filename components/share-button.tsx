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
        className="btn btn-secondary"
        onClick={() => void share()}
      >
        Share
      </button>
      {note ? (
        <span role="status" className="text-sm text-ink-soft">
          {note}
        </span>
      ) : null}
    </span>
  );
}
