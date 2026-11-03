import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Newsreader } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { MotionRoot } from "@/components/motion-root";
import { getSettings } from "@/lib/public-data";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  display: "swap",
  variable: "--font-bricolage",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-newsreader",
});

export const viewport: Viewport = {
  themeColor: "#ecede8",
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${settings.businessName} — poured paintings from ${settings.town}`, template: `%s — ${settings.businessName}` },
    description: `Original poured paintings and handmade pieces from a family studio in ${settings.town}, ${settings.region}. Ask about any piece directly.`,
    applicationName: settings.businessName,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${newsreader.variable} h-full`}>
      <body className="flex min-h-dvh flex-col bg-gesso font-sans text-ink">
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        {children}
        <div className="grain" aria-hidden="true" />
        <MotionRoot />
        <Analytics />
      </body>
    </html>
  );
}
