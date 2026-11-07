import type { Metadata } from "next";
import { getSettings } from "@/lib/public-data";

export const metadata: Metadata = { title: "Privacy" };

export default async function PrivacyPage() {
  const settings = await getSettings();
  return (
    <main className="shell max-w-4xl py-16 md:py-24">
      <header className="border-b border-line pb-10">
        <h1 className="display text-[clamp(3rem,8vw,7rem)]">Privacy</h1>
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
