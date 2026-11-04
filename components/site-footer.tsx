import Link from "next/link";
import type { ShopSettings } from "@/lib/settings";

export function SiteFooter({ settings }: { settings: ShopSettings }) {
  return (
    <footer className="bg-bone hairline-t text-umber py-16 sm:py-20 no-print">
      <div className="shell grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12 mb-14">
        {/* Brand & Manifesto */}
        <div className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-semibold tracking-tight text-ink">
              {settings.businessName.toUpperCase()}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-terracotta border border-terracotta/40 px-1 py-0.5 rounded-sm">
              ARCHIVE
            </span>
          </div>
          <p className="text-xs text-umber font-sans leading-relaxed">
            A family sanctuary of analog slow craft. Every artifact shaped by hand with natural river timber, mineral earth, and pure beeswax.
          </p>
          <div className="font-mono text-[10px] tracking-wider uppercase text-umber pt-2">
            <p>Bench: {settings.town}, {settings.region}</p>
            <p>Roots: Chamundi Foothills, Mysore (Est. 1964)</p>
          </div>
        </div>

        {/* Navigation / Holdings */}
        <div className="space-y-3 font-mono text-xs">
          <p className="font-bold uppercase tracking-widest text-ink text-[11px] mb-3">ARCHIVE FOLIOS</p>
          <ul className="space-y-2">
            <li>
              <Link href="/#works" className="hover:text-ink transition-colors">
                Series XI: Poured Pigment Panels
              </Link>
            </li>
            <li>
              <Link href="/#works" className="hover:text-ink transition-colors">
                Carved Hardwood Vessels &amp; Stools
              </Link>
            </li>
            <li>
              <Link href="/#works" className="hover:text-ink transition-colors">
                Wood-Fired Ceramic Artifacts
              </Link>
            </li>
            <li>
              <Link href="/#inquire" className="hover:text-ink transition-colors text-terracotta">
                Architectural Commissions
              </Link>
            </li>
          </ul>
        </div>

        {/* Custodial Policies */}
        <div className="space-y-3 font-mono text-xs">
          <p className="font-bold uppercase tracking-widest text-ink text-[11px] mb-3">CUSTODY &amp; DISPATCH</p>
          <ul className="space-y-2">
            <li>
              <Link href="/#acquisition" className="hover:text-ink transition-colors">
                Archival Crating &amp; Transit
              </Link>
            </li>
            <li>
              <Link href="/#acquisition" className="hover:text-ink transition-colors">
                Certificate of Hand-Signed Deed
              </Link>
            </li>
            <li>
              <Link href="/#acquisition" className="hover:text-ink transition-colors">
                Lifetime Bench Re-Waxing Guarantee
              </Link>
            </li>
            <li>
              <Link href="/policies" className="hover:text-ink transition-colors">
                Studio Terms &amp; Policies
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact & Hours */}
        <div className="space-y-3 font-mono text-xs">
          <p className="font-bold uppercase tracking-widest text-ink text-[11px] mb-3">STUDIO INQUIRIES</p>
          <p className="text-xs text-umber font-sans">
            Curatorial visits by appointment in Collegeville, PA and Mysore.
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
              [Direct Bench Inquiry ↗]
            </Link>
          </div>
        </div>
      </div>

      <div className="shell pt-8 hairline-t flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-widest text-umber">
        <p>© 1964–2026 {settings.businessName.toUpperCase()} ATELIER &amp; ARCHIVE. ALL SPECIMEN NUMBERS PERPETUALLY REGULATED.</p>
        <p className="flex items-center gap-2">
          <span>ONE OF ONE EDITIONS ONLY</span>
          <span>•</span>
          <Link href="/privacy" className="hover:text-ink transition-colors underline">
            Privacy
          </Link>
        </p>
      </div>
    </footer>
  );
}
