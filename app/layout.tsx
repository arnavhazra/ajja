import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Courier_Prime, Newsreader } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { brand } from "@/lib/brand";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "optional",
  variable: "--font-display",
});

const reader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "optional",
  variable: "--font-reader",
});

// Ledger voice for the mono labels — globals.css --font-mono points at --font-type.
const ledger = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "optional",
  variable: "--font-type",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F0E5" },
    { media: "(prefers-color-scheme: dark)", color: "#241C15" },
  ],
};

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: brand.title,
      template: `%s — ${brand.name}`,
    },
    description: brand.description,
    applicationName: brand.name,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${display.variable} ${reader.variable} ${ledger.variable} scroll-smooth h-full`}>
      <body className="flex min-h-dvh flex-col bg-wall font-sans text-tar antialiased">
        <nav aria-label="Skip links">
          <a className="skip-link" href="#content">
            Skip to content
          </a>
        </nav>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
