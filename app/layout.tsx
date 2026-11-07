import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Big_Shoulders_Stencil, Courier_Prime } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { getSettings } from "@/lib/public-data";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

const display = Big_Shoulders({
  subsets: ["latin"],
  axes: ["opsz"],
  display: "optional",
  variable: "--font-display",
});

const stencil = Big_Shoulders_Stencil({
  subsets: ["latin"],
  axes: ["opsz"],
  display: "optional",
  variable: "--font-stencil",
});

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
    { media: "(prefers-color-scheme: light)", color: "#E6E8E0" },
    { media: "(prefers-color-scheme: dark)", color: "#21231D" },
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
    <html lang="en" data-scroll-behavior="smooth" className={`${display.variable} ${stencil.variable} ${ledger.variable} scroll-smooth h-full`}>
      <body className="flex min-h-dvh flex-col bg-wall font-sans text-tar antialiased">
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
