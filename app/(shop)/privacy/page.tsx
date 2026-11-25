import type { Metadata } from "next";
import { getSettings } from "@/lib/public-data";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What the studio keeps when you send a message, and what it never stores.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    type: "website",
    siteName: brand.name,
    title: `Privacy — ${brand.name}`,
    description: "What the studio keeps when you send a message, and what it never stores.",
    url: "/privacy",
  },
};

export default async function PrivacyPage() {
  const settings = await getSettings();
  return (
    <main className="shell max-w-4xl py-16 md:py-24">
      <header className="border-b border-line pb-10">
        <p className="kicker">House rules — <span className="nums">ledger · what the studio keeps</span></p>
        <h1 className="display mt-[10px] text-[clamp(2.4rem,4.6vw,4.25rem)]">Privacy</h1>
      </header>
      <div className="prose max-w-[65ch] mt-10 grid gap-5 text-tar-soft">
        <p>This shop does not ask you to make an account.</p>
        <p>
          If you send a message, the name, phone or email, and message are saved so they can be answered. Messages are kept for{" "}
          {settings.enquiryRetentionDays} days, then deleted.
        </p>
        <p>
          A count is kept of page views, WhatsApp taps, calls, shares, saves, and searches. That count uses a daily code made from the connection. The raw network address is not stored.
        </p>
        <p>Vercel Analytics is used without a tracking cookie. Photographs are stored so the shop can show them.</p>
        <p>Nothing on this site takes a card payment.</p>
      </div>
    </main>
  );
}
