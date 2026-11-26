import Link from "next/link";
import { brand } from "@/lib/brand";
import type { ShopSettings } from "@/lib/settings";

export function SiteFooter({ settings, pigments = [], hasStory = false }: { settings: ShopSettings; pigments?: string[]; hasStory?: boolean }) {
  return (
    <footer className="foot no-print">
      {pigments.length ? (
        <div className="ribbon" aria-hidden="true">
          {pigments.map((hex, index) => (
            <i key={`${hex}-${index}`} style={{ background: hex }} />
          ))}
        </div>
      ) : null}
      <div className="shell py-14 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-4">
            <p className="micro-label font-bold text-vat-ink">
              {brand.name} — MONOGRAPH
            </p>
            <p className="type mt-4 max-w-[34ch] text-sm leading-relaxed text-vat-soft">
              Handcrafted paintings and fine woodwork from our family studio in {settings.town}, {settings.region}. Every piece is one of a kind.
            </p>
          </div>

          <nav className="md:col-span-4" aria-label="The site">
            <p className="micro-label text-vat-soft">DIRECTORY</p>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm">
              <li>
                <Link href="/#index" className="inline-flex min-h-11 items-center text-vat-ink hover:text-white hover:underline underline-offset-4">
                  The index
                </Link>
              </li>
              <li>
                <Link href="/category/all" className="inline-flex min-h-11 items-center text-vat-ink hover:text-white hover:underline underline-offset-4">
                  All pieces
                </Link>
              </li>
              {hasStory ? (
                <li>
                  <Link href="/#studio" className="inline-flex min-h-11 items-center text-vat-ink hover:text-white hover:underline underline-offset-4">
                    The studio
                  </Link>
                </li>
              ) : null}
              <li>
                <Link href="/#buying" className="inline-flex min-h-11 items-center text-vat-ink hover:text-white hover:underline underline-offset-4">
                  The terms
                </Link>
              </li>
              <li>
                <Link href="/#inquire" className="inline-flex min-h-11 items-center text-vat-ink hover:text-white hover:underline underline-offset-4">
                  Send a note
                </Link>
              </li>
            </ul>
          </nav>

          <div className="md:col-span-4">
            <p className="micro-label text-vat-soft md:text-right">ACQUISITION NOTES</p>
            <div className="mt-3 rounded-[2px] border border-vat-ink/20 bg-white/[0.03] p-4">
              <p className="type text-sm leading-relaxed text-vat-ink">
                {settings.paymentNote || "No payment is taken on this website. Arrangements proceed via direct correspondence with the studio."}
              </p>
              {settings.email ? (
                <a className="ledger mt-3 inline-flex min-h-11 items-center text-xs text-vat-soft underline underline-offset-4 hover:text-white" href={`mailto:${settings.email}`}>
                  {settings.email}
                </a>
              ) : settings.mapUrl ? (
                <a className="ledger mt-3 inline-flex min-h-11 items-center text-xs text-vat-soft underline underline-offset-4 hover:text-white" href={settings.mapUrl}>
                  {settings.town}, {settings.region} ↗
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-vat-ink/15 pt-6 text-xs text-vat-soft">
          <span className="ledger">
            © {brand.name} · {settings.town}, {settings.region}.
          </span>
          <div className="flex items-center gap-6">
            <Link href="/policies" className="ledger inline-flex min-h-11 items-center text-vat-soft hover:text-vat-ink">
              Policies
            </Link>
            <Link href="/privacy" className="ledger inline-flex min-h-11 items-center text-vat-soft hover:text-vat-ink">
              Privacy
            </Link>
            <Link href="/#inquire" className="ledger inline-flex min-h-11 items-center text-vat-soft hover:text-vat-ink">
              Send a note
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
