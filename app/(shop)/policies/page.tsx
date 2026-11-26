import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/public-data";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Policies",
  description: "Buying, collection, and returns for pieces from the studio.",
  alternates: { canonical: "/policies" },
  openGraph: {
    type: "website",
    siteName: brand.name,
    title: `Policies — ${brand.name}`,
    description: "Buying, collection, and returns for pieces from the studio.",
    url: "/policies",
  },
};

export default async function PoliciesPage() {
  const settings = await getSettings();
  const sections = [
    { label: "TRANSACTION MODEL", title: "Buying", body: settings.policies.buying },
    { label: "HANDOVER & TRANSIT", title: "Collection & delivery", body: settings.policies.collection },
    { label: "TERMS", title: "Returns", body: settings.policies.returns },
  ];

  return (
    <main className="shell pb-20 pt-6 md:pb-28 md:pt-8">
      <header className="border-b border-line pb-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/#index" className="micro-label inline-flex min-h-11 items-center gap-2 text-tar hover:text-sap">
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-sap text-[11px] font-bold text-wall">§</span>
            <span>Direct arrangements / The terms</span>
          </Link>
          <span className="micro-label text-tar-soft">
            {settings.town}, {settings.region}
          </span>
        </div>
        <h1 className="disp text-[clamp(2.5rem,5vw,4.25rem)] text-tar">Policies</h1>
        <p className="type mt-3 max-w-2xl text-lg text-tar-soft">
          Nothing is paid on this website. Every arrangement is made directly with the studio in {settings.town}.
        </p>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {sections.map((section, index) => (
          <section
            key={section.title}
            className="flex flex-col justify-between rounded-[2px] border border-line bg-surface-low p-7 md:p-8"
          >
            <div>
              <div className="mb-5 flex items-center justify-between gap-2 border-b border-line pb-3">
                <span className="micro-label text-sap">Section · {String(index + 1).padStart(2, "0")}</span>
                <span className="ledger text-xs text-tar-soft">{section.label}</span>
              </div>
              <h2 className="disp text-2xl text-tar">{section.title}</h2>
              <p className="type mt-3 text-base leading-relaxed text-tar-soft">{section.body}</p>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
