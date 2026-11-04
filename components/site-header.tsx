"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { AmbientSound } from "@/components/shop/ambient-sound";
import { CurrencySelector } from "@/components/shop/currency-provider";
import { useFolio } from "@/components/shop/collectors-folio";

export function SiteHeader({ name }: { name: string }) {
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
    <header className="sticky top-0 z-40 w-full transition-all duration-300 no-print">
      {/* 1. Curatorial Archival Dispatch Top Bar */}
      <div className="bg-bone text-umber border-b border-line text-[10px] sm:text-[11px] font-mono tracking-widest uppercase transition-colors">
        <div className="shell flex items-center justify-between py-1.5 gap-4">
          <div className="flex items-center gap-2 truncate">
            <span className="inline-block size-1.5 rounded-full bg-terracotta shrink-0" />
            <span className="truncate">
              ATELIER &amp; ARCHIVE • COLLEGEVILLE &amp; MYSORE • EST. 1964 // EDITION 01 / CATALOGUE RAISONNÉ
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <AmbientSound />
            <div className="hidden sm:block">
              <CurrencySelector />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Classical Atelier Gallery Header */}
      <div
        className={cn(
          "hairline-b transition-all duration-300",
          scrolled ? "bg-linen/95 backdrop-blur-md shadow-sm" : "bg-linen/90 backdrop-blur-sm",
        )}
      >
        <div className="shell flex h-20 items-center justify-between gap-4">
          {/* Classical Wordmark + Live Dispatch Status */}
          <div className="flex items-center gap-5">
            <Link href="/" className="group focus:outline-none" aria-label={`${name}, home`}>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
                  {name.toUpperCase()}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-terracotta border border-terracotta/40 px-1.5 py-0.5 rounded-sm">
                  ARCHIVE
                </span>
              </div>
              <p className="font-mono text-[9px] tracking-widest uppercase text-umber -mt-1">
                Atelier &amp; Archive • Est. 1964
              </p>
            </Link>

            <div className="hidden xl:block h-7 w-[1px] bg-line" />

            <div className="hidden xl:block">
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-moss" />
                Studio Open • Collegeville &amp; Mysore
              </p>
              <p className="font-mono text-[9px] text-umber tracking-wider">
                Original Woodwork, Ceramics &amp; Poured Pigments
              </p>
            </div>
          </div>

          {/* Minimal Text Category Filters */}
          <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-1 bg-bone p-1 rounded-sm hairline-box">
            <Link
              href="/#works"
              className="px-3 py-1.5 rounded-sm text-[11px] font-mono tracking-wider uppercase text-umber hover:text-ink hover:bg-boneDark transition-colors"
            >
              The Archive
            </Link>
            <Link
              href="/#atelier"
              className="px-3 py-1.5 rounded-sm text-[11px] font-mono tracking-wider uppercase text-umber hover:text-ink hover:bg-boneDark transition-colors"
            >
              The Atelier
            </Link>
            <Link
              href="/#method"
              className="px-3 py-1.5 rounded-sm text-[11px] font-mono tracking-wider uppercase text-umber hover:text-ink hover:bg-boneDark transition-colors"
            >
              Method &amp; Provenance
            </Link>
            <Link
              href="/#acquisition"
              className="px-3 py-1.5 rounded-sm text-[11px] font-mono tracking-wider uppercase text-umber hover:text-ink hover:bg-boneDark transition-colors"
            >
              Acquisition &amp; Crating
            </Link>
          </nav>

          {/* Right Action Controls: Inquire / Commission + Collector's Folio */}
          <div className="flex items-center gap-3">
            <Link
              href="/#inquire"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-mono uppercase tracking-wider text-umber hover:text-ink hairline-box rounded-sm bg-bone/70 hover:bg-bone transition-colors"
            >
              <span>Inquire / Commission</span>
            </Link>

            <button
              type="button"
              onClick={() => setFolioOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-sm bg-ink text-linen hover:bg-terracotta transition-colors shadow-sm cursor-pointer"
              aria-label={`Open Collector's Bag, ${items.length} items`}
            >
              <span className="font-mono text-[11px] uppercase tracking-widest">Bag / Folio</span>
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-terracotta text-linen">
                {items.length}
              </span>
            </button>

            {/* Mobile Menu Trigger */}
            <button
              type="button"
              className="btn btn-secondary min-h-10 px-3 text-xs lg:hidden cursor-pointer"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMobileMenuOpen(true)}
            >
              Menu
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <dialog
        id="mobile-menu"
        ref={dialogRef}
        className="sheet lg:hidden bg-linen text-ink p-0 backdrop:bg-night/60"
        aria-label="Studio Menu"
        onClose={() => setMobileMenuOpen(false)}
        onClick={(e) => {
          if (e.target === dialogRef.current) setMobileMenuOpen(false);
        }}
      >
        <div className="safe-bottom grid gap-5 p-6 bg-linen">
          <div className="flex items-center justify-between hairline-b pb-4">
            <span className="font-serif text-2xl font-semibold">{name} ARCHIVE</span>
            <button
              type="button"
              className="btn btn-quiet min-h-9 px-2 text-xs cursor-pointer"
              onClick={() => setMobileMenuOpen(false)}
            >
              Close
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 py-2 border-b border-line">
            <span className="font-mono text-xs text-umber">CURRENCY:</span>
            <CurrencySelector />
          </div>

          <nav aria-label="Mobile Navigation Links" className="grid gap-1 font-serif text-2xl">
            <Link
              href="/#works"
              onClick={() => setMobileMenuOpen(false)}
              className="py-3 border-b border-line hover:text-terracotta transition-colors"
            >
              The Archive Manifest
            </Link>
            <Link
              href="/#atelier"
              onClick={() => setMobileMenuOpen(false)}
              className="py-3 border-b border-line hover:text-terracotta transition-colors"
            >
              The Atelier &amp; Maker Credo
            </Link>
            <Link
              href="/#method"
              onClick={() => setMobileMenuOpen(false)}
              className="py-3 border-b border-line hover:text-terracotta transition-colors"
            >
              Method &amp; Provenance
            </Link>
            <Link
              href="/#acquisition"
              onClick={() => setMobileMenuOpen(false)}
              className="py-3 border-b border-line hover:text-terracotta transition-colors"
            >
              Acquisition &amp; Crating
            </Link>
          </nav>

          <Link
            href="/#inquire"
            onClick={() => setMobileMenuOpen(false)}
            className="btn btn-primary w-full text-center"
          >
            Inquire on a Commission
          </Link>
        </div>
      </dialog>
    </header>
  );
}
