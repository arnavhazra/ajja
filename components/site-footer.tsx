import Link from "next/link";
import type { ShopSettings } from "@/lib/settings";

export function SiteFooter({ settings }: { settings: ShopSettings }) {
  return (
    <footer className="bg-bone hairline-t text-umber py-16 sm:py-20 no-print">
      <div className="shell grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12 mb-14">
        {/* Brand */}
        <div className="space-y-4">
          <span className="font-serif text-3xl font-semibold tracking-tight text-ink">
            {settings.businessName}
          </span>
          <p className="text-xs text-umber font-sans leading-relaxed">
            {settings.story}
          </p>
          <p className="font-mono text-[10px] tracking-wider uppercase text-umber pt-2">
            {settings.town}, {settings.region}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-3 font-mono text-xs">
          <p className="font-bold uppercase tracking-widest text-ink text-[11px] mb-3">The site</p>
          <ul className="space-y-2">
            <li>
              <Link href="/#works" className="hover:text-ink transition-colors">
                All works
              </Link>
            </li>
            <li>
              <Link href="/#studio" className="hover:text-ink transition-colors">
                The studio
              </Link>
            </li>
            <li>
              <Link href="/#buying" className="hover:text-ink transition-colors">
                Buying, delivery &amp; care
              </Link>
            </li>
            <li>
              <Link href="/#inquire" className="hover:text-ink transition-colors text-terracotta">
                Ask about a piece or a commission
              </Link>
            </li>
          </ul>
        </div>

        {/* Care */}
        <div className="space-y-3 font-mono text-xs">
          <p className="font-bold uppercase tracking-widest text-ink text-[11px] mb-3">Good to know</p>
          <ul className="space-y-2">
            <li>
              <Link href="/#buying" className="hover:text-ink transition-colors">
                Packing &amp; delivery
              </Link>
            </li>
            <li>
              <Link href="/#buying" className="hover:text-ink transition-colors">
                Studio visits
              </Link>
            </li>
            <li>
              <Link href="/policies" className="hover:text-ink transition-colors">
                Buying, collection &amp; returns
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-ink transition-colors">
                Privacy
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div className="space-y-3 font-mono text-xs">
          <p className="font-bold uppercase tracking-widest text-ink text-[11px] mb-3">Ask the studio</p>
          <p className="text-xs text-umber font-sans">
            Studio visits by appointment in {settings.town}, {settings.region}.
          </p>
          {settings.email ? (
            <p className="font-mono text-xs text-ink font-semibold pt-1">
              <a href={`mailto:${settings.email}`} className="hover:text-terracotta transition-colors">
                {settings.email}
              </a>
            </p>
          ) : null}
          <div className="pt-2">
            <Link
              href="/#inquire"
              className="inline-block px-3 py-1.5 bg-linen hairline-box rounded-sm text-[10px] uppercase tracking-wider text-ink hover:bg-terracotta hover:text-linen transition-colors"
            >
              Send a note ↗
            </Link>
          </div>
        </div>
      </div>

      <div className="shell pt-8 hairline-t flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-widest text-umber">
        <p>© {settings.businessName}. Made by hand.</p>
        <p>Made by hand in {settings.town}, {settings.region}.</p>
      </div>
    </footer>
  );
}
