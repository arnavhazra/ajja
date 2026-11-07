"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CurrencySelector } from "@/components/shop/currency-provider";
import { useFolio } from "@/components/shop/collectors-folio";

const NAV_LINKS = [
  { href: "/#works", label: "the wall" },
  { href: "/#shelf", label: "the shelf" },
  { href: "/#studio", label: "the bench" },
  { href: "/#buying", label: "the terms" },
  { href: "/#inquire", label: "send a note" },
] as const;

export function SiteHeader({ name, hasPrices }: { name: string; hasPrices: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { items, setIsOpen: setFolioOpen } = useFolio();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (mobileMenuOpen && !dialog.open) dialog.showModal();
    if (!mobileMenuOpen && dialog.open) dialog.close();
  }, [mobileMenuOpen]);

  return (
    <header className="mast sticky top-0 z-40 w-full border-b border-line bg-wall no-print">
      <div className="shell flex min-h-[60px] items-center gap-[22px]">
        <Link href="/" className="word inline-flex min-h-11 items-center text-tar">
          {name}
          <span>.</span>
        </Link>

        <nav aria-label="Sections" className="mast-nav">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-[18px] text-[13.5px]">
          {hasPrices ? (
            <div className="hidden md:block">
              <CurrencySelector />
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setFolioOpen(true)}
            className="hidden min-h-11 items-center gap-1 text-tar-soft hover:text-tar cursor-pointer sm:inline-flex"
            aria-label={`Saved ${items.length} ${items.length === 1 ? "piece" : "pieces"}`}
          >
            saved <b className="font-bold text-tar">({items.length})</b>
          </button>

          <Link href="/#inquire" className="ask hidden sm:inline-flex">
            ask the studio →
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center border border-line px-3 font-bold cursor-pointer lg:hidden"
            aria-expanded={mobileMenuOpen}
            aria-label="Menu"
          >
            menu
          </button>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        className="sheet lg:hidden fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-wall p-0 text-tar backdrop:bg-vat/60"
        aria-label="Menu"
        onClose={() => setMobileMenuOpen(false)}
        onClick={(e) => {
          if (e.target === dialogRef.current) setMobileMenuOpen(false);
        }}
      >
        <div className="safe-bottom grid gap-5 p-6 bg-wall">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <span className="word">{name}<span>.</span></span>
            <button
              type="button"
              className="btn btn-quiet min-h-11 px-2 text-sm cursor-pointer"
              onClick={() => setMobileMenuOpen(false)}
            >
              close
            </button>
          </div>

          {hasPrices ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-2">
              <span className="text-sm text-tar-soft">currency</span>
              <CurrencySelector />
            </div>
          ) : null}

          <nav aria-label="Menu links" className="grid gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="disp inline-flex min-h-11 items-center border-b border-line py-3 text-3xl"
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setFolioOpen(true);
              }}
              className="inline-flex min-h-11 items-center py-3 text-left text-tar-soft cursor-pointer"
            >
              saved <b className="ml-1 font-bold text-tar">({items.length})</b>
            </button>
          </nav>

          <Link href="/#inquire" onClick={() => setMobileMenuOpen(false)} className="ask w-full justify-center min-h-11">
            ask the studio →
          </Link>
        </div>
      </dialog>
    </header>
  );
}
