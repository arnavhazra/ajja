"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { AmbientSound } from "@/components/shop/ambient-sound";
import { CurrencySelector } from "@/components/shop/currency-provider";
import { FolioButton } from "@/components/shop/collectors-folio";

const LINKS = [
  { href: "/#works", label: "Works" },
  { href: "/#studio", label: "Studio" },
  { href: "/#buying", label: "Buying" },
  { href: "/#visit", label: "Visit" },
];

export function SiteHeader({ name }: { name: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const dialog = menuRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <header
      className={cn(
        "no-print sticky top-0 z-40 transition-[background-color,box-shadow] duration-300",
        scrolled ? "bg-gesso/92 shadow-[0_1px_0_var(--line)] backdrop-blur-md" : "bg-transparent",
      )}
    >
      <div className="shell flex h-16 items-center justify-between gap-4 md:h-20">
        <Link href="/" className="display text-[2rem] leading-none md:text-[2.25rem] shrink-0" aria-label={`${name}, home`}>
          {name}
          <span aria-hidden="true" className="ml-0.5 inline-block size-2 rounded-full bg-pour align-baseline" />
        </Link>

        {/* Sensory audio and currency controls */}
        <div className="hidden lg:flex items-center gap-3">
          <AmbientSound />
          <CurrencySelector />
        </div>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="inline-flex min-h-11 items-center px-3 text-[0.95rem]">
              <span className="ink-link">{link.label}</span>
            </Link>
          ))}
          <FolioButton className="ml-2" />
          <Link href="/#visit" className="btn btn-primary ml-2 min-h-11 px-5 text-sm">
            Ask about a piece
          </Link>
        </nav>

        {/* Mobile quick folio + menu */}
        <div className="flex items-center gap-2 md:!hidden">
          <FolioButton />
          <button
            type="button"
            className="btn btn-secondary min-h-11 px-4 text-sm cursor-pointer"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen(true)}
          >
            Menu
          </button>
        </div>
      </div>

      <dialog
        id="site-menu"
        ref={menuRef}
        className="sheet md:hidden"
        aria-label="Menu"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
      >
        <div className="safe-bottom grid gap-4 p-5">
          <div className="flex items-center justify-between">
            <span className="display text-3xl">{name}</span>
            <button type="button" className="btn btn-quiet min-h-11 cursor-pointer" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 py-2 border-y border-line">
            <AmbientSound />
            <CurrencySelector />
          </div>

          <nav aria-label="Menu links" className="mt-2 grid">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="display-wide flex min-h-14 items-center border-b border-line text-3xl"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link href="/#visit" onClick={() => setOpen(false)} className="btn btn-primary mt-4 w-full">
            Ask about a piece
          </Link>
        </div>
      </dialog>
    </header>
  );
}
