import Link from "next/link";
import type { ShopSettings } from "@/lib/settings";

/** The night wall: a cropped wordmark, then the few doors worth keeping. */
export function PourFooter({ settings }: { settings: ShopSettings }) {
  return (
    <footer className="pr-footer">
      <div className="shell">
        <p className="pr-footer-word" aria-hidden="true">
          {settings.businessName}
        </p>
        <div className="pr-footer-grid">
          <nav aria-label="The site">
            <h2>The site</h2>
            <Link href="/#works">All works</Link>
            <Link href="/#shelf">The colour run</Link>
            <Link href="/#studio">The studio</Link>
            <Link href="/#buying">Buying, delivery &amp; care</Link>
            <Link href="/#inquire">Ask about a piece or a commission</Link>
          </nav>
          <nav aria-label="Good to know">
            <h2>Good to know</h2>
            <Link href="/policies">Buying, collection &amp; returns</Link>
            <Link href="/privacy">Privacy</Link>
          </nav>
          <div className="pr-footer-studio">
            <h2>The studio</h2>
            <p>
              A family studio in {settings.town}, {settings.region}. Visits by appointment.
            </p>
            {settings.email ? (
              <a href={`mailto:${settings.email}`}>{settings.email}</a>
            ) : settings.mapUrl ? (
              <a href={settings.mapUrl} rel="noopener noreferrer">
                {settings.town}, {settings.region} ↗
              </a>
            ) : null}
          </div>
        </div>
        <div className="pr-footer-base">
          <span>© {settings.businessName}. Made by hand.</span>
          <span>
            {settings.town}, {settings.region}
          </span>
        </div>
      </div>
    </footer>
  );
}
