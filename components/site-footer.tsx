import Link from "next/link";
import type { ShopSettings } from "@/lib/settings";

export function SiteFooter({ settings }: { settings: ShopSettings }) {
  const outside = [
    settings.instagram ? { href: settings.instagram, label: "Instagram" } : null,
    settings.facebook ? { href: settings.facebook, label: "Facebook" } : null,
    settings.whatsappChannel ? { href: settings.whatsappChannel, label: "WhatsApp channel" } : null,
  ].filter((link): link is { href: string; label: string } => link !== null);
  return (
    <footer className="hairline-t bg-linen px-4 py-12 md:px-8">
      <div className="mx-auto grid max-w-[1440px] gap-10 md:grid-cols-3">
        <div>
          <p className="font-serif text-3xl font-medium text-ink">{settings.businessName}</p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-umber">
            Archive Ref: AJJA-CLV
          </p>
          <p className="mt-4 max-w-xs text-xs leading-relaxed text-umber">
            Every piece is held in the {settings.town} studio until collected. Direct enquiry
            only — no cart, no checkout. A piece with no price is a piece you ask about.
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-terracotta">
            The studio
          </p>
          <p className="mt-4 text-sm text-ink">
            {settings.town}, {settings.region}
          </p>
          <p className="mt-1 text-xs text-umber">Visits by appointment.</p>
          {settings.mapUrl ? (
            <a
              href={settings.mapUrl}
              className="mt-3 inline-flex min-h-[44px] items-center font-mono text-[10px] uppercase tracking-[0.2em] text-ink underline decoration-terracotta underline-offset-4"
            >
              Studio map
            </a>
          ) : null}
        </div>
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-terracotta">
            Ledger
          </p>
          <nav className="mt-4 flex flex-col" aria-label="Ledger">
            {[
              { href: "/#manifest-grid", label: "Archive" },
              { href: "/#inquiry-section", label: "Inquire" },
              { href: "/policies", label: "Policies" },
              { href: "/privacy", label: "Privacy" },
              ...outside,
            ].map((link) =>
              link.href.startsWith("/") ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex min-h-[44px] items-center font-mono text-[10px] uppercase tracking-[0.2em] text-umber transition-colors hover:text-ink"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="inline-flex min-h-[44px] items-center font-mono text-[10px] uppercase tracking-[0.2em] text-umber transition-colors hover:text-ink"
                >
                  {link.label}
                </a>
              ),
            )}
          </nav>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-[1440px] font-mono text-[9px] uppercase tracking-[0.24em] text-umber">
        Typeset in Cormorant Garamond &amp; Space Mono · Collegeville, Pennsylvania
      </p>
    </footer>
  );
}
