import type { Metadata } from "next";
import { getSettings } from "@/lib/public-data";

export const metadata: Metadata = { title: "Policies" };

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
        <h1 className="display text-[clamp(3rem,8vw,7rem)]">Policies</h1>
      </header>
      <div className="mt-2">
        {sections.map(([title, body]) => (
          <section key={title} className="border-b border-line py-10">
            <h2 className="display-wide text-3xl">{title}</h2>
            <p className="prose-serif measure mt-4 text-ink-soft">{body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
