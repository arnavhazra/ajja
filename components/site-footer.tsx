import Link from "next/link";
import type { ShopSettings } from "@/lib/settings";

const LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/studio", label: "Studio" },
  { href: "/search", label: "Search" },
  { href: "/saved", label: "Saved" },
  { href: "/visit", label: "Visit" },
  { href: "/about", label: "Our story" },
  { href: "/sold", label: "Sold" },
  { href: "/policies", label: "Policies" },
  { href: "/privacy", label: "Privacy" },
];

export function SiteFooter({ settings }: { settings: ShopSettings }) {
  const outside = [
    settings.instagram ? { href: settings.instagram, label: "Instagram" } : null,
    settings.facebook ? { href: settings.facebook, label: "Facebook" } : null,
    settings.whatsappChannel ? { href: settings.whatsappChannel, label: "WhatsApp channel" } : null,
  ].filter((link): link is { href: string; label: string } => link !== null);
  return (
    <footer className="mt-auto border-t border-line px-4 py-12 md:px-8">
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <p className="font-display text-3xl text-ink">{settings.businessName}</p>
          <p className="mt-2 text-ink-soft">
            {settings.town}, {settings.region}
          </p>
          {settings.heroText ? <p className="measure mt-3">{settings.heroText}</p> : null}
        </div>
        <nav className="flex flex-col" aria-label="More">
          {outside.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="inline-flex min-h-12 items-center text-ink no-underline transition-opacity duration-150 ease-out hover:opacity-70"
            >
              {link.label}
            </a>
          ))}
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-12 items-center text-ink no-underline transition-opacity duration-150 ease-out hover:opacity-70"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
