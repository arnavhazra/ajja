"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useFolio } from "@/components/shop/collectors-folio";

export function SiteHeader({ name, hasStory }: { name: string; hasStory: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const { items, setIsOpen: setFolioOpen } = useFolio();

  const links = [
    { href: "/#index", label: "the index" },
    { href: "/category/all", label: "all pieces" },
    ...(hasStory ? [{ href: "/#studio", label: "the studio" }] : []),
    { href: "/#buying", label: "the terms" },
    { href: "/#inquire", label: "send a note" },
  ] as const;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (mobileMenuOpen && !dialog.open) dialog.showModal();
    if (!mobileMenuOpen && dialog.open) dialog.close();
  }, [mobileMenuOpen]);

  return (
    <header className="mast sticky top-0 z-40 w-full border-b border-line bg-wall/95 backdrop-blur-sm no-print">
      <div className="shell flex min-h-[64px] items-center justify-between gap-5">
        <Link href="/" className="inline-flex min-h-11 items-baseline gap-2.5 text-tar">
          <span className="ledger text-[0.875rem] font-bold uppercase tracking-[0.16em] text-tar">{name}</span>
          <span className="ledger hidden text-xs text-tar-soft sm:inline">[folio]</span>
        </Link>

        <nav aria-label="Sections" className="mast-nav hidden lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFolioOpen(true)}
            className="ledger hidden min-h-11 cursor-pointer items-center gap-1.5 rounded-[2px] border border-line bg-wall-deep/70 px-3.5 text-xs text-tar transition-colors hover:border-line-strong hover:bg-wall-deep sm:inline-flex"
            aria-label={`Saved ${items.length} ${items.length === 1 ? "piece" : "pieces"}`}
          >
            <span>saved</span>
            <b className="font-bold text-tar">({items.length})</b>
          </button>

          <Link
            href="/#inquire"
            className="ledger hidden min-h-11 items-center gap-1.5 rounded-[2px] bg-tar px-4 text-xs font-bold text-wall transition-colors hover:bg-sap sm:inline-flex"
          >
            ask the studio →
          </Link>

          <button
            type="button"
            ref={menuButtonRef}
            onClick={() => setMobileMenuOpen(true)}
            className="ledger inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[2px] border border-line-strong px-3.5 text-xs font-bold uppercase tracking-widest text-tar lg:hidden"
            aria-expanded={mobileMenuOpen}
            aria-label="Menu"
          >
            menu
          </button>
        </div>
      </div>

      <noscript>
        <nav aria-label="Menu links" className="shell flex flex-wrap items-center gap-4 border-t border-line py-3 text-sm">
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      </noscript>

      <dialog
        ref={dialogRef}
        className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-tar backdrop:bg-vat/60"
        aria-label="Menu"
        onClose={() => {
          setMobileMenuOpen(false);
          menuButtonRef.current?.focus();
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) setMobileMenuOpen(false);
        }}
      >
        <div className="safe-bottom ml-auto grid h-dvh w-full max-w-md content-start gap-6 border-l border-line bg-wall p-6">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <span className="ledger text-sm font-bold uppercase tracking-[0.16em] text-tar">
              {name} <span className="font-normal text-tar-soft">[folio]</span>
            </span>
            <button
              type="button"
              className="ledger inline-flex min-h-11 cursor-pointer items-center px-3 text-xs uppercase tracking-widest text-tar-soft hover:text-tar"
              onClick={() => setMobileMenuOpen(false)}
            >
              close
            </button>
          </div>

          <nav aria-label="Menu links" className="grid gap-1">
            {links.map((link, idx) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex min-h-11 items-baseline gap-3 border-b border-line py-3.5 text-tar hover:text-sap"
              >
                <span className="ledger text-xs text-sap">{String(idx + 1).padStart(2, "0")}</span>
                <span className="disp text-2xl">{link.label}</span>
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setFolioOpen(true);
              }}
              className="ledger inline-flex min-h-11 cursor-pointer items-center py-3 text-left text-sm text-tar-soft hover:text-tar"
            >
              saved <b className="ml-1.5 font-bold text-tar">({items.length})</b>
            </button>
          </nav>

          <Link
            href="/#inquire"
            onClick={() => setMobileMenuOpen(false)}
            className="ledger inline-flex min-h-12 w-full items-center justify-center rounded-[2px] bg-tar px-5 text-xs font-bold uppercase tracking-widest text-wall hover:bg-sap"
          >
            ask the studio →
          </Link>
        </div>
      </dialog>
    </header>
  );
}
