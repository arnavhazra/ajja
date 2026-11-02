import type { Metadata } from "next";
import Script from "next/script";
import { Newsreader, Source_Sans_3, Spectral } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { getSettings } from "@/lib/public-data";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
  preload: false,
  variable: "--font-spectral",
});
const newsreader = Newsreader({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-newsreader" });
const sourceSans = Source_Sans_3({ subsets: ["latin"], display: "swap", preload: false, variable: "--font-source" });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: settings.businessName, template: `%s · ${settings.businessName}` },
    description: settings.heroText,
    applicationName: settings.businessName,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <html
      lang="en"
      data-theme={settings.theme}
      data-font={settings.fontPair}
      className={`${spectral.variable} ${newsreader.variable} ${sourceSans.variable} h-full`}
    >
      <body className="min-h-dvh flex flex-col">
        <Script id="ajja-prefs" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem('ajja-text');var c=localStorage.getItem('ajja-contrast');if(t)document.documentElement.dataset.text=t;if(c)document.documentElement.dataset.contrast=c;}catch(e){}`}
        </Script>
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
