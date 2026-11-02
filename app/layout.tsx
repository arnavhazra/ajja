import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans, Space_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { MotionRoot } from "@/components/motion-root";
import { getSettings } from "@/lib/public-data";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-cormorant",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-jakarta",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-mono",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${settings.businessName} · Atelier & Archive`, template: `%s · ${settings.businessName}` },
    description: "Original poured paintings and fine handcrafted woodwork from Collegeville, Pennsylvania.",
    applicationName: settings.businessName,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${jakarta.variable} ${spaceMono.variable} h-full`}
    >
      <body className="min-h-dvh flex flex-col font-sans bg-linen text-ink selection:bg-terracotta selection:text-linen">
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        {children}
        <div className="paper-grain" aria-hidden="true" />
        <MotionRoot />
        <Analytics />
      </body>
    </html>
  );
}
