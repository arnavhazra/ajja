import Link from "next/link";
import { TextControls } from "./text-controls";
import type { ShopSettings } from "@/lib/settings";
import { digits } from "@/lib/whatsapp";

const PRIMARY = [
  { href: "/shop", label: "Shop" },
  { href: "/studio", label: "Studio" },
  { href: "/visit", label: "Visit" },
  { href: "/about", label: "Our story" },
];

const MENU = [
  ...PRIMARY,
  { href: "/search", label: "Search" },
  { href: "/saved", label: "Saved" },
];

function contactAction(settings: ShopSettings) {
  const whatsapp = digits(settings.whatsapp);
  if (whatsapp) return { href: `https://wa.me/${whatsapp}`, label: "WhatsApp" };
  const phone = digits(settings.phone);
  if (phone) return { href: `tel:${phone}`, label: "Call" };
  return null;
}

export function SiteHeader({ settings }: { settings: ShopSettings }) {
  const contact = contactAction(settings);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper">
      {settings.announcementLive && settings.announcement ? (
        <p className="border-b border-line bg-paper-2 px-4 py-3 text-center text-ink">{settings.announcement}</p>
      ) : null}
      <div className="flex items-center gap-3 px-4 py-2 md:px-8">
        <div className="min-w-0 flex-1">
          <Link href="/" className="block min-h-12 no-underline">
            <span className="font-display text-3xl text-ink">{settings.businessName}</span>
            <span className="block text-ink-soft">
              {settings.town}, {settings.region}
            </span>
          </Link>
        </div>
        <nav className="nav-inline flex items-center gap-1" aria-label="Shop">
          {PRIMARY.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-12 items-center px-3 text-ink no-underline transition-opacity duration-150 ease-out hover:opacity-70"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end gap-2">
          <details className="nav-inline relative">
            <summary className="control cursor-pointer px-4">Text</summary>
            <div className="absolute right-0 z-50 mt-2 border border-line bg-paper p-3">
              <TextControls />
            </div>
          </details>
          {contact ? (
            <a className="btn btn-primary" href={contact.href}>
              {contact.label}
            </a>
          ) : null}
          <details className="nav-menu">
            <summary className="control cursor-pointer px-4">Menu</summary>
            <nav className="absolute inset-x-4 top-full z-50 mt-2 flex flex-col gap-1 border border-line bg-paper p-3" aria-label="Shop">
              {MENU.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex min-h-12 items-center px-2 text-ink no-underline"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 border-t border-line pt-3">
                <TextControls />
              </div>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
