import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Courier_Prime, Newsreader } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
    { media: "(prefers-color-scheme: light)", color: "#f3ede2" },
    { media: "(prefers-color-scheme: dark)", color: "#221b15" },
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
    openGraph: {
      type: "website",
      siteName: brand.name,
      title: brand.title,
      description: brand.description,
      url: siteUrl(),
    },
    twitter: { card: "summary_large_image" },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${reader.variable} ${ledger.variable} h-full`}>
      <body className="flex min-h-dvh flex-col bg-wall font-sans text-tar antialiased">
        <nav aria-label="Skip links">
          <a className="skip-link" href="#content">
            Skip to content
          </a>
        </nav>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
