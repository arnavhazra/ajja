import Link from "next/link";
import { brand } from "@/lib/brand";
import type { ShopSettings } from "@/lib/settings";

export function SiteFooter({ settings, pigments = [] }: { settings: ShopSettings; pigments?: string[] }) {
  return (
    <footer className="foot no-print">
      {pigments.length ? (
        <div className="ribbon" aria-hidden="true">
          {pigments.map((hex, index) => (
            <i key={`${hex}-${index}`} style={{ background: hex }} />
          ))}
        </div>
      ) : null}
      <div className="shell foot-in">
        <div className="foot-top">
          <div>
            <p className="word">
              {brand.name}
            </p>
            <p className="mt-[14px] max-w-[26ch] text-[13.5px] text-vat-soft">
              a family studio in {settings.town}, {settings.region}
            </p>
          </div>

          <nav className="foot-col" aria-label="The site">
            <p className="foot-col-label">the site</p>
            <Link href="/#index">the index</Link>
            <Link href="/category/all">all pieces</Link>
            <Link href="/#studio">the studio</Link>
            <Link href="/#buying">buying, delivery &amp; care</Link>
            <Link href="/#inquire">ask about a piece or a commission</Link>
          </nav>

          <nav className="foot-col" aria-label="Good to know">
            <p className="foot-col-label">good to know</p>
            <Link href="/policies">buying, collection &amp; returns</Link>
            <Link href="/#studio">studio visits</Link>
            <Link href="/privacy">privacy</Link>
          </nav>

          <div className="foot-note">
            <p className="foot-col-label foot-col">&gt; the studio</p>
            <p>Studio visits by appointment in {settings.town}, {settings.region}.</p>
            {settings.email ? (
              <a className="map" href={`mailto:${settings.email}`}>
                {settings.email}
              </a>
            ) : settings.mapUrl ? (
              <a className="map" href={settings.mapUrl}>
                {settings.town}, {settings.region} ↗
              </a>
            ) : null}
          </div>
        </div>

        <div className="foot-bot">
          <span>© {brand.name}. Made by hand.</span>
          <span>made by hand in {settings.town}, {settings.region}.</span>
        </div>
      </div>
    </footer>
  );
}
