"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import type { PublicProduct } from "@/lib/types";

export function SavedDrawer({
  products,
  savedIds,
  isOpen,
  onClose,
  onToggleSave,
}: {
  products: PublicProduct[];
  savedIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onToggleSave: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) return null;

  const savedProducts = products.filter((p) => savedIds.includes(p.id));

  const handleInquireAll = () => {
    onClose();
    const inquiryInput = document.getElementById("inquirySubject") as HTMLInputElement | null;
    const formSection = document.getElementById("inquiry-section");
    if (inquiryInput && savedProducts.length) {
      const summary = savedProducts
        .map((p) => p.title || p.attributes?.medium || `Piece #${p.slug.slice(-6).toUpperCase()}`)
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
                Saved Works ({savedProducts.length})
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
            {savedProducts.length === 0 ? (
              <div className="py-12 text-center text-umber space-y-3">
                <p className="font-serif text-xl text-ink">No pieces saved yet.</p>
                <p className="text-xs">
                  Click [+ Save] on any poured painting or woodwork to curate your private selection.
                </p>
              </div>
            ) : (
              savedProducts.map((piece) => {
                const img = piece.images[0];
                const price = piece.priceMinor != null ? formatMoney(piece.priceMinor, piece.currency) : "Inquire for price";
                const title = piece.title || piece.attributes?.medium || (piece.categoryName === "Woodwork" ? "Handcrafted Woodwork" : "Poured Painting");

                return (
                  <div
                    key={piece.id}
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
                      </p>
                      <p className="font-mono text-xs font-bold text-ink mt-0.5">
                        {price}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleSave(piece.id)}
                      className="text-umber hover:text-sold font-mono text-xs p-1"
                      title="Remove from saved"
                      aria-label={`Remove ${title}`}
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 bg-bone hairline-t space-y-3">
          <div className="font-mono text-[10px] text-umber leading-relaxed">
            Direct studio connection: Inquire below to arrange private inspection or studio collection in Collegeville, PA.
          </div>

          {savedProducts.length > 0 ? (
            <button
              type="button"
              onClick={handleInquireAll}
              className="w-full py-3.5 px-4 bg-terracotta hover:bg-terracotta-dark text-linen font-mono text-xs uppercase tracking-widest rounded-sm transition-colors cursor-pointer text-center"
            >
              [Inquire on Saved Works ({savedProducts.length})]
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
