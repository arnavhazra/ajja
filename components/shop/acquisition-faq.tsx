"use client";

import { useState } from "react";
import type { ShopSettings } from "@/lib/settings";

/** Questions answered only by what the owner actually wrote in the desk. */
export function AcquisitionFaq({ settings }: { settings: ShopSettings }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const items: { num: string; title: string; content: string }[] = [];
  if (settings.leadTime.trim()) items.push({ num: "01", title: "Timing", content: settings.leadTime });
  if (settings.holds.trim()) items.push({ num: "02", title: "Holds", content: settings.holds });
  if (settings.commissions.trim()) items.push({ num: "03", title: "Custom work", content: settings.commissions });
  for (const faq of settings.faqs) items.push({ num: String(items.length + 1).padStart(2, "0"), title: faq.q, content: faq.a });
  if (settings.policies.buying.trim()) items.push({ num: String(items.length + 1).padStart(2, "0"), title: "Buying", content: settings.policies.buying });
  if (settings.policies.collection.trim()) items.push({ num: String(items.length + 1).padStart(2, "0"), title: "Collection & delivery", content: settings.policies.collection });
  if (settings.policies.returns.trim()) items.push({ num: String(items.length + 1).padStart(2, "0"), title: "Returns", content: settings.policies.returns });

  if (!items.length) return null;

  return (
    <section id="buying" className="hairline-b py-16 sm:py-24">
      <div className="shell max-w-4xl mx-auto">
        <div className="mb-12">
          <p className="tag text-pour">03 — Good to know</p>
          <h2 className="display-wide mt-2 text-3xl sm:text-4xl">Buying, delivery &amp; care</h2>
        </div>
        <ol className="grid gap-0">
          {items.map((item, index) => (
            <li key={item.num + item.title} className="hairline-b last:border-b-0">
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                aria-expanded={openIndex === index}
                className="flex min-h-11 w-full items-baseline justify-between gap-6 py-5 text-left cursor-pointer"
              >
                <span className="flex items-baseline gap-4">
                  <span className="nums tag">{item.num}</span>
                  <span className="display-wide text-xl sm:text-2xl">{item.title}</span>
                </span>
                <span aria-hidden="true" className="text-ink-soft">{openIndex === index ? "−" : "+"}</span>
              </button>
              {openIndex === index ? <p className="caption pb-6 pl-10 text-lg">{item.content}</p> : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
