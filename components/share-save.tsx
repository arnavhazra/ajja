"use client";

import { useState, useSyncExternalStore } from "react";
import { pieceMessage, whatsAppHref } from "@/lib/whatsapp";

const KEY = "ajja-saved";
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readSaved() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function ShareSave({
  title,
  url,
  slug,
  whatsapp,
  shop,
}: {
  title: string;
  url: string;
  slug: string;
  whatsapp: string;
  shop: string;
}) {
  const saved = useSyncExternalStore(
    subscribe,
    () => readSaved().includes(slug),
    () => false,
  );
  const [note, setNote] = useState("");

  async function beacon(type: string) {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, path: location.pathname }),
    });
  }

  async function share() {
    const data = { title, text: title, url };
    if (navigator.share) {
      await navigator.share(data);
      await beacon("share");
      return;
    }
    await navigator.clipboard.writeText(url);
    setNote("Link copied.");
    await beacon("share");
  }

  function toggleSave() {
    const next = readSaved().filter((item) => item !== slug);
    if (!saved) next.push(slug);
    localStorage.setItem(KEY, JSON.stringify(next));
    emit();
    void beacon("save");
  }

  const message = pieceMessage({ shop, title, price: null, url });
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className="btn btn-secondary" onClick={() => void share()}>
        Share
      </button>
      <button type="button" className="btn btn-quiet" aria-pressed={saved} onClick={toggleSave}>
        {saved ? "Saved" : "Save"}
      </button>
      {whatsapp ? (
        <a className="btn btn-quiet" href={whatsAppHref(whatsapp, message)}>
          WhatsApp
        </a>
      ) : null}
      <a className="btn btn-quiet" href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`}>
        Email
      </a>
      {note ? <p role="status" className="w-full text-accent">{note}</p> : null}
    </div>
  );
}

export function readSavedSlugs() {
  return readSaved();
}
