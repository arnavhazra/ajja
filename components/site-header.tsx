"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { CurrencySelector } from "@/components/shop/currency-provider";
import { useFolio } from "@/components/shop/collectors-folio";

const NAV_LINKS = [
  { href: "/#works", label: "Works" },
  { href: "/#studio", label: "The studio" },
  { href: "/#buying", label: "Buying" },
  { href: "/#inquire", label: "Ask us" },
] as const;

export function SiteHeader({ name, hasPrices }: { name: string; hasPrices: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { items, setIsOpen: setFolioOpen } = useFolio();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (mobileMenuOpen && !dialog.open) dialog.showModal();
    if (!mobileMenuOpen && dialog.open) dialog.close();
  }, [mobileMenuOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full hairline-b transition-all duration-300 no-print",
        scrolled ? "bg-linen/95 backdrop-blur-md shadow-sm" : "bg-linen/90 backdrop-blur-sm",
      )}
    >
      <div className="shell flex h-16 items-center justify-between gap-4">
        <Link href="/" className="font-serif text-2xl font-semibold tracking-tight text-ink hover:text-terracotta transition-colors">
          {name}
        </Link>

        <nav aria-label="Sections" className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-umber hover:text-ink transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {hasPrices ? (
            <div className="hidden sm:block">
              <CurrencySelector />
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setFolioOpen(true)}
            className="group relative inline-flex min-h-11 items-center gap-1.5 rounded-sm hairline-box bg-bone px-3 font-mono text-[11px] uppercase tracking-wider text-ink hover:bg-boneDark transition-colors cursor-pointer"
            aria-label={`Saved ${items.length} ${items.length === 1 ? "piece" : "pieces"}`}
          >
            Saved{" "}
            <span
              className={cn(
                "inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold transition-transform nums",
                items.length > 0 ? "bg-terracotta text-linen" : "bg-plate-deep text-umber",
              )}
            >
              {items.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden inline-flex min-h-11 items-center rounded-sm hairline-box bg-bone px-3 font-mono text-[11px] uppercase tracking-wider text-ink cursor-pointer"
            aria-expanded={mobileMenuOpen}
          >
            Menu
          </button>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        className="sheet lg:hidden bg-linen text-ink p-0 backdrop:bg-night/60"
        aria-label="Menu"
        onClose={() => setMobileMenuOpen(false)}
        onClick={(e) => {
          if (e.target === dialogRef.current) setMobileMenuOpen(false);
        }}
      >
        <div className="safe-bottom grid gap-5 p-6 bg-linen">
          <div className="flex items-center justify-between hairline-b pb-4">
            <span className="font-serif text-2xl font-semibold">{name}</span>
            <button
              type="button"
              className="btn btn-quiet min-h-9 px-2 text-xs cursor-pointer"
              onClick={() => setMobileMenuOpen(false)}
            >
              Close
            </button>
          </div>

          {hasPrices ? (
            <div className="flex flex-wrap items-center justify-between gap-3 py-2 border-b border-line">
              <span className="font-mono text-xs text-umber">Currency</span>
              <CurrencySelector />
            </div>
          ) : null}

          <nav aria-label="Menu links" className="grid gap-1 font-serif text-2xl">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 border-b border-line hover:text-terracotta transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/#inquire"
            onClick={() => setMobileMenuOpen(false)}
            className="btn btn-primary w-full text-center"
          >
            Ask the studio
          </Link>
        </div>
      </dialog>
    </header>
  );
}
