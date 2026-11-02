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
    <main className="max-w-3xl px-4 py-8 md:px-8">
      <header className="border-b border-line pb-6">
        <h1 className="text-4xl text-ink md:text-5xl">Policies</h1>
      </header>
      <div className="mt-2">
        {sections.map(([title, body]) => (
          <section key={title} className="border-b border-line py-6">
            <h2 className="text-2xl text-ink">{title}</h2>
            <p className="measure mt-3">{body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
