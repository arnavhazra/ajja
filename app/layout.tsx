import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Newsreader, Space_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { getSettings } from "@/lib/public-data";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal"],
  display: "optional",
  variable: "--font-bricolage",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "optional",
  variable: "--font-newsreader",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "optional",
  variable: "--font-mono",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3EFE7" },
    { media: "(prefers-color-scheme: dark)", color: "#1B1813" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: `${settings.businessName} — handmade pieces from ${settings.town}, ${settings.region}`,
      template: `%s — ${settings.businessName}`,
    },
    description: `Paintings and woodwork made by hand in ${settings.town}, ${settings.region}. See the pieces, then ask the studio — nothing is paid online.`,
    applicationName: settings.businessName,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${bricolage.variable} ${newsreader.variable} ${spaceMono.variable} scroll-smooth h-full`}>
      <body className="flex min-h-dvh flex-col bg-gesso font-sans text-ink antialiased">
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        {children}
        <div className="grain" aria-hidden="true" />
        <Analytics />
      </body>
    </html>
  );
}
