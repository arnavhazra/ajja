import type { Metadata } from "next";
import { getSettings } from "@/lib/public-data";

export const metadata: Metadata = { title: "Privacy" };

export default async function PrivacyPage() {
  const settings = await getSettings();
  return (
    <main className="max-w-3xl px-4 py-8 md:px-8">
      <header className="border-b border-line pb-6">
        <h1 className="text-4xl text-ink md:text-5xl">Privacy</h1>
      </header>
      <div className="measure mt-6 grid gap-4">
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
