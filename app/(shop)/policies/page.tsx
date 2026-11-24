import type { Metadata } from "next";
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
    ["Buying", settings.policies.buying],
    ["Collection", settings.policies.collection],
    ["Returns", settings.policies.returns],
  ];
  return (
    <main className="shell max-w-4xl py-16 md:py-24">
      <header className="border-b border-line pb-10">
        <p className="kicker">Direct arrangements — <span className="nums">ledger · the terms</span></p>
        <h1 className="display mt-[10px] text-[clamp(2.4rem,4.6vw,4.25rem)]">Policies</h1>
      </header>
      <div className="mt-2">
        {sections.map(([title, body]) => (
          <section key={title} className="border-b border-line py-10">
            <h2 className="display-wide text-3xl">{title}</h2>
            <p className="prose max-w-[65ch] mt-4 text-tar-soft">{body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
