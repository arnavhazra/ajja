import Link from "next/link";
import { SavedWorksButton } from "./saved-works-button";
import type { ShopSettings } from "@/lib/settings";

const NAV = [
  { href: "/#manifest-grid", label: "Archive" },
  { href: "/#studio-note", label: "Studio" },
  { href: "/#transfer", label: "Transfer" },
  { href: "/#inquiry-section", label: "Inquire" },
];

export function SiteHeader({ settings }: { settings: ShopSettings }) {
  return (
    <>
      <div className="hairline-b bg-linen px-4 py-2 md:px-8">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between font-mono text-[9px] uppercase tracking-[0.24em] text-umber">
          <p>
            {settings.town}, {settings.region} · Private Studio
          </p>
          <p className="hidden sm:block">By appointment</p>
        </div>
      </div>
      {settings.announcementLive && settings.announcement ? (
        <p className="hairline-b bg-bone px-4 py-2.5 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-ink">
          {settings.announcement}
        </p>
      ) : null}
      <header className="sticky top-0 z-40 hairline-b bg-linen/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 md:px-8">
          <div className="flex items-baseline gap-3">
            <Link
              href="/"
              className="font-serif text-2xl font-medium tracking-tight text-ink md:text-3xl"
            >
              {settings.businessName}
            </Link>
            <span className="rounded-sm bg-ink px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-linen">
              Archive
            </span>
          </div>
          <nav
            className="order-3 flex w-full items-center gap-5 overflow-x-auto md:order-none md:w-auto md:flex-1 md:justify-center"
            aria-label="Archive"
          >
            {NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-h-[44px] shrink-0 items-center font-mono text-[10px] uppercase tracking-[0.22em] text-umber transition-colors hover:text-terracotta"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center md:ml-0">
            <SavedWorksButton />
          </div>
        </div>
      </header>
    </>
  );
}
