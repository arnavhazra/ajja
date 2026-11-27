"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { folioTotals } from "@/lib/folio";
import { formatMoney } from "@/lib/money";
import { emitChange, getFolioSnapshot, useFolio } from "./folio-store";

interface SavedResponseItem {
  slug: string;
  title: string;
  priceMinor: number | null;
  status: string;
  image?: { url: string } | null;
}

const FOCUSABLE = "a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex='-1'])";

export function FolioDrawer() {
  const { items, isOpen, setIsOpen, removeItem, clear } = useFolio();
  const format = (minor: number) => formatMoney(minor, "USD");
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // Re-read live titles and prices whenever the drawer opens.
  useEffect(() => {
    if (!isOpen || items.length === 0) return;
    const slugs = items.map((item) => item.slug).join(",");
    let cancelled = false;
    fetch(`/api/saved?slugs=${encodeURIComponent(slugs)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { items?: SavedResponseItem[] } | null) => {
        if (cancelled || !data?.items?.length) return;
        const fresh = new Map(data.items.map((item) => [item.slug, item]));
        const next = getFolioSnapshot()
          .filter((item) => fresh.has(item.slug))
          .map((item) => {
            const live = fresh.get(item.slug);
            if (!live) return item;
            return {
              ...item,
              title: live.title,
              priceMinor: live.priceMinor,
              status: live.status,
              imageUrl: live.image?.url ?? item.imageUrl,
            };
          });
        emitChange(next);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Focus trap + Escape + focus restore.
  useEffect(() => {
    if (!isOpen) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = () => Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && (!active || active === first || !panel?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (!active || active === last || !panel?.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const first = focusables()[0];
    first?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      restoreFocusRef.current?.focus?.();
      restoreFocusRef.current = null;
    };
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  const { pricedCount, totalMinor } = folioTotals(items);
  const formattedTotal = format(totalMinor);

  const handleInquireAll = () => {
    setIsOpen(false);
    const slugs = items.map((item) => item.slug).join(",");
    router.push(`/?pieces=${encodeURIComponent(slugs)}#inquire`);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Saved pieces">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-vat/50 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={panelRef}
        className="relative flex h-full w-full max-w-md flex-col bg-wall shadow-2xl safe-bottom border-l border-line"
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <h2 className="display-wide text-xl">Saved pieces</h2>
            <p className="caption text-xs text-tar-soft">
              {items.length === 1 ? "1 piece saved" : `${items.length} pieces saved`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="btn btn-quiet min-h-11 px-3 text-sm cursor-pointer"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="inline-block size-3 rounded-full bg-pigment/40 mb-3" />
              <p className="text-lg text-tar-soft">Nothing saved yet.</p>
              <p className="text-xs text-tar-soft max-w-xs mt-1">
                Tap &ldquo;Save&rdquo; on any piece to keep it here, then ask about them all in one note.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 border-b border-line pb-4">
                  {item.imageUrl ? (
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-[2px] bg-wall-deep">
                      <Image src={item.imageUrl} alt={item.title} fill sizes="80px" className="object-cover" />
                    </div>
                  ) : (
                    <div className="size-20 shrink-0 rounded-[2px] bg-wall-deep" />
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
                      {item.kind ? <p className="caption text-xs text-tar-soft truncate">{item.kind}</p> : null}
                      {item.dimensions ? <p className="font-mono text-[11px] text-tar-soft truncate">{item.dimensions}</p> : null}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="nums text-xs font-semibold text-tar">
                        {item.status === "sold" ? "sold" : item.priceMinor ? format(item.priceMinor) : "Ask for the price"}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="inline-flex min-h-11 items-center px-2 text-xs text-sold/80 hover:text-sold hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 ? (
          <div className="border-t border-line bg-wall-deep/40 p-6 space-y-4">
            {pricedCount > 0 ? (
              <div className="flex items-baseline justify-between">
                <span className="caption text-sm">Total of priced pieces</span>
                <span className="nums text-xl font-bold">{formattedTotal ?? "—"}</span>
              </div>
            ) : null}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleInquireAll}
                className="btn btn-pigment w-full text-center min-h-11 cursor-pointer"
              >
                Ask about these pieces ({items.length})
              </button>
              <button
                type="button"
                onClick={clear}
                className="flex min-h-11 w-full items-center justify-center text-center text-xs text-tar-soft hover:text-tar cursor-pointer py-1"
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
