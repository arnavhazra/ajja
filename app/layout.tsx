import type { Metadata, Viewport } from "next";
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
  variable: "--font-serif",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-mono",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-sans",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F4EE" },
    { media: "(prefers-color-scheme: dark)", color: "#1E1B18" },
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
    <html lang="en" className={`${cormorant.variable} ${spaceMono.variable} ${jakarta.variable} scroll-smooth h-full`}>
      <body className="flex min-h-dvh flex-col bg-linen font-sans text-ink antialiased">
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
