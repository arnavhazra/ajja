"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    num: "01",
    title: "Packing & delivery",
    content:
      "Every piece is wrapped and packed by hand. How it reaches you — collection, courier, timing — is agreed with you directly before anything leaves the studio.",
  },
  {
    num: "02",
    title: "Studio visits",
    content:
      "You can visit the studio in Collegeville, Pennsylvania by appointment to see a piece in daylight before you decide.",
  },
  {
    num: "03",
    title: "Paying for a piece",
    content:
      "Nothing is paid on this site. Once we agree a price, payment is arranged with the studio directly — by whatever method suits us both.",
  },
  {
    num: "04",
    title: "Custom work",
    content:
      "Commissions start with a conversation about size, wood or canvas, and where the piece will live. Ask the studio what is possible.",
  },
];

export function AcquisitionFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section id="buying" className="py-16 sm:py-24 hairline-b bg-linen">
      <div className="shell max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-terracotta mb-2 font-bold">
            How it works
          </p>
          <h2 className="font-serif text-3xl sm:text-5xl text-ink font-normal mb-3">
            Buying, delivery &amp; care
          </h2>
          <p className="text-sm text-umber max-w-lg mx-auto font-sans leading-relaxed">
            There is no checkout here. Every piece starts with a conversation.
          </p>
        </div>

        <div className="space-y-4">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.num} className="bg-bone hairline-box rounded-sm overflow-hidden transition-colors">
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left cursor-pointer hover:bg-boneDark transition-colors"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs font-bold text-terracotta">{item.num}</span>
                    <span className="font-serif text-xl sm:text-2xl text-ink font-medium">{item.title}</span>
                  </div>
                  <span className="font-mono text-lg text-umber shrink-0 pl-4">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen ? (
                  <div className="px-6 pb-6 pt-2 hairline-t bg-linen/50 text-sm text-umber font-sans leading-relaxed">
                    <p>{item.content}</p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
