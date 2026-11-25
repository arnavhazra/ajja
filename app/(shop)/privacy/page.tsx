import type { Metadata } from "next";
import Link from "next/link";
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
  const entries = [
    {
      code: "ACCOUNTS",
      title: "No visitor accounts",
      body: "This shop does not ask you to create an account or sign in to browse or send a note.",
    },
    {
      code: "MESSAGES",
      title: "Enquiry retention",
      body: `If you send a message, the name, phone or email, and message are saved so they can be answered. Messages are kept for ${settings.enquiryRetentionDays} days, then deleted.`,
    },
    {
      code: "COUNTERS",
      title: "Aggregate studio counts",
      body: "A count is kept of page views, WhatsApp taps, calls, shares, saves, and searches. That count uses a daily code made from the connection. The raw network address is not stored.",
    },
    {
      code: "ANALYTICS & PAYMENTS",
      title: "No tracking cookies or card processing",
      body: "Vercel Analytics is used without a tracking cookie. Photographs are stored so the shop can show them. Nothing on this site takes a card payment.",
    },
  ];

  return (
    <main className="shell pb-20 pt-6 md:pb-28 md:pt-8">
      <header className="border-b border-line pb-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/#index" className="micro-label inline-flex min-h-11 items-center gap-2 text-tar hover:text-sap">
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-sap text-[11px] font-bold text-wall">§</span>
            <span>House rules / What the studio keeps</span>
          </Link>
          <span className="micro-label text-tar-soft">
            {settings.town}, {settings.region}
          </span>
        </div>
        <h1 className="disp text-[clamp(2.5rem,5vw,4.25rem)] text-tar">Privacy</h1>
        <p className="type mt-3 max-w-2xl text-lg text-tar-soft">
          A plain record of what the studio saves when you write, and what it never collects.
        </p>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {entries.map((entry, index) => (
          <section
            key={entry.title}
            className="flex flex-col justify-between rounded-[2px] border border-line bg-surface-low p-7 md:p-8"
          >
            <div>
              <div className="mb-5 flex items-center justify-between gap-2 border-b border-line pb-3">
                <span className="micro-label text-sap">Record · {String(index + 1).padStart(2, "0")}</span>
                <span className="ledger text-xs text-tar-soft">{entry.code}</span>
              </div>
              <h2 className="disp text-xl text-tar md:text-2xl">{entry.title}</h2>
              <p className="type mt-3 text-base leading-relaxed text-tar-soft">{entry.body}</p>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
