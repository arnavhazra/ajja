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
    <header className="mast sticky top-0 z-40 w-full border-b border-line bg-wall no-print">
      <div className="shell flex min-h-[60px] items-center gap-[22px]">
        <Link href="/" className="word inline-flex min-h-11 items-center text-tar">
          {name}
        </Link>

        <nav aria-label="Sections" className="mast-nav hidden lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-[18px] text-[13.5px]">
          <Link href="/category/all" className="hidden min-h-11 items-center text-tar-soft hover:text-tar lg:inline-flex">
            all pieces
          </Link>

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
            ref={menuButtonRef}
            onClick={() => setMobileMenuOpen(true)}
            className="inline-flex min-h-11 items-center justify-center border border-line-strong px-3.5 text-sm font-semibold cursor-pointer"
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
        <div className="safe-bottom ml-auto grid h-dvh w-full max-w-md content-start gap-5 bg-wall p-6">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <span className="word">{name}</span>
            <button
              type="button"
              className="btn btn-quiet min-h-11 px-2 text-sm cursor-pointer"
              onClick={() => setMobileMenuOpen(false)}
            >
              close
            </button>
          </div>

          <nav aria-label="Menu links" className="grid gap-1">
            {links.map((link) => (
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
