"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { pieceTitle } from "./product-card";

export type SavedItem = {
  slug: string;
  title: string;
  priceMinor: number | null;
  currency: string;
  status: string;
  categoryName: string | null;
  medium: string | null;
  image: { url: string; alt: string; focalX: number; focalY: number } | null;
};

export function SavedDrawer({
  items,
  savedSlugs,
  loading,
  isOpen,
  onClose,
  onToggleSave,
}: {
  items: SavedItem[];
  savedSlugs: string[];
  loading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onToggleSave: (slug: string) => void;
}) {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const drawerRef = useRef<HTMLElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    restoreFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const drawer = drawerRef.current;
    drawer?.querySelector<HTMLElement>("button, a, [tabindex]")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !drawer) return;
      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex='-1'])"),
      ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
      if (!focusable.length) return;
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      restoreFocus.current?.focus();
    };
  }, [isOpen, onClose]);

  const savedItems = items.filter((p) => savedSlugs.includes(p.slug));
  const missingCount = savedSlugs.length - savedItems.length;

  const handleInquireAll = () => {
    onClose();
    const inquiryInput = document.getElementById("inquirySubject") as HTMLInputElement | null;
    const formSection = document.getElementById("inquiry-section");
    if (inquiryInput && savedItems.length) {
      const summary = savedItems
        .map((p) => pieceTitle(p.title, p.categoryName, p.medium ? { medium: p.medium } : {}))
        .join(", ");
      inquiryInput.value = `Saved pieces inquiry: ${summary}`;
    }
    if (formSection) {
      formSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-ink/25 backdrop-blur-[2px] z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Saved Studio Works"
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-bone hairline-l z-50 flex flex-col justify-between shadow-[-20px_0_60px_rgba(30,27,24,0.14)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div>
          <div className="px-6 py-5 hairline-b flex items-center justify-between bg-bone">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-terracotta font-bold">
                STUDIO SELECTION
              </p>
              <h2 className="font-serif text-2xl text-ink font-medium">
                Saved Works ({savedSlugs.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-sm hairline-box bg-linen hover:bg-ink hover:text-linen text-ink flex items-center justify-center font-mono text-sm transition-colors cursor-pointer"
              title="Close Saved Works Drawer"
              aria-label="Close Saved Works"
            >
              ✕
            </button>
          </div>

          {/* List */}
          <div className="p-6 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto">
            {loading ? (
              <p className="py-12 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-umber">
                Reading the ledger…
              </p>
            ) : savedSlugs.length === 0 ? (
              <div className="py-12 text-center text-umber space-y-3">
                <p className="font-serif text-xl text-ink">No pieces saved yet.</p>
                <p className="text-xs">
                  Click [+ Save] on any poured painting or woodwork to curate your private selection.
                </p>
              </div>
            ) : (
              <>
                {savedItems.map((piece) => {
                  const img = piece.image;
                  const price = piece.priceMinor != null ? formatMoney(piece.priceMinor, piece.currency) : "Inquire for price";
                  const title = pieceTitle(piece.title, piece.categoryName, piece.medium ? { medium: piece.medium } : {});

                  return (
                    <div
                      key={piece.slug}
                      className="p-3 bg-linen hairline-box rounded-sm flex items-center gap-3.5 relative group"
                    >
                      <div className="w-16 h-16 rounded-sm bg-bone-dark overflow-hidden shrink-0 relative">
                        {img ? (
                          <Image
                            src={img.url}
                            alt={img.alt || title}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/p/${piece.slug}`}
                          onClick={onClose}
                          className="font-serif text-base text-ink font-medium truncate block hover:text-terracotta transition-colors"
                        >
                          {title}
                        </Link>
                        <p className="font-mono text-[10px] text-umber">
                          #{piece.slug.slice(-6).toUpperCase()} • {piece.categoryName || "Studio Piece"}
                          {piece.status === "sold" ? " • Sold" : ""}
                        </p>
                        <p className="font-mono text-xs font-bold text-ink mt-0.5">
                          {price}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleSave(piece.slug)}
                        className="text-umber hover:text-terracotta font-mono text-xs p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        title="Remove from saved"
                        aria-label={`Remove ${title}`}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
                {missingCount > 0 && !loading ? (
                  <p className="font-mono text-[10px] text-umber leading-relaxed">
                    {missingCount} saved {missingCount === 1 ? "piece is" : "pieces are"} no longer in the archive.
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 bg-bone hairline-t space-y-3">
          <div className="font-mono text-[10px] text-umber leading-relaxed">
            Direct studio connection: Inquire below to arrange private inspection or studio collection in Collegeville, PA.
          </div>

          {savedItems.length > 0 ? (
            <button
              type="button"
              onClick={handleInquireAll}
              className="w-full py-3.5 px-4 bg-terracotta hover:bg-terracotta-dark text-linen font-mono text-xs uppercase tracking-widest rounded-sm transition-colors cursor-pointer text-center"
            >
              [Inquire on Saved Works ({savedItems.length})]
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 bg-ink text-linen font-mono text-xs uppercase tracking-widest rounded-sm transition-colors text-center"
            >
              Browse Archive
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
