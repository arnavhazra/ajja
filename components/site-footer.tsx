import Link from "next/link";
import type { ShopSettings } from "@/lib/settings";
import { digits } from "@/lib/whatsapp";

export function SiteFooter({ settings }: { settings: ShopSettings }) {
  const contact = [
    settings.email ? { href: `mailto:${settings.email}`, label: settings.email } : null,
    settings.phone ? { href: `tel:${digits(settings.phone)}`, label: settings.phone } : null,
    settings.whatsapp ? { href: `https://wa.me/${digits(settings.whatsapp)}`, label: "WhatsApp" } : null,
    settings.whatsappChannel ? { href: settings.whatsappChannel, label: "WhatsApp channel" } : null,
    settings.instagram ? { href: settings.instagram, label: "Instagram" } : null,
    settings.facebook ? { href: settings.facebook, label: "Facebook" } : null,
  ].filter((item): item is { href: string; label: string } => item !== null);
  return (
    <footer className="no-print overflow-hidden bg-night text-gesso">
      <div className="shell grid gap-12 pb-8 pt-20 md:grid-cols-12 md:pt-28">
        <div className="md:col-span-5">
          <p className="display-wide text-3xl md:text-4xl">
            Made by hand in {settings.town}, {settings.region}.
          </p>
          <p className="mt-4 max-w-sm text-gesso/70">{settings.paymentNote}</p>
        </div>
        <nav aria-label="Footer" className="grid content-start gap-1 md:col-span-3 md:col-start-7">
          <Link className="inline-flex min-h-11 items-center text-gesso/85 hover:text-gesso" href="/#works">
            Works
          </Link>
          <Link className="inline-flex min-h-11 items-center text-gesso/85 hover:text-gesso" href="/policies">
            Buying, collection, and returns
          </Link>
          <Link className="inline-flex min-h-11 items-center text-gesso/85 hover:text-gesso" href="/privacy">
            Privacy
          </Link>
        </nav>
        <div className="grid content-start gap-1 md:col-span-3">
          {contact.map((item) => (
            <a key={item.href} className="inline-flex min-h-11 items-center break-all text-gesso/85 hover:text-gesso" href={item.href}>
              {item.label}
            </a>
          ))}
          {settings.mapUrl ? (
            <a className="inline-flex min-h-11 items-center text-gesso/85 hover:text-gesso" href={settings.mapUrl} rel="noopener" target="_blank">
              Map of {settings.town}
            </a>
          ) : null}
        </div>
      </div>
      <div className="shell" aria-hidden="true">
        <p
          data-word={settings.businessName}
          className="display select-none text-[29vw] leading-[0.74] tracking-[-0.06em] text-gesso/[0.07] before:content-[attr(data-word)]"
        />
      </div>
      <div className="shell flex flex-wrap justify-between gap-2 border-t border-gesso/10 py-5 text-sm text-gesso/55">
        <p>
          © {settings.businessName}
        </p>
        <p>Every photograph is the piece itself.</p>
      </div>
    </footer>
  );
}
