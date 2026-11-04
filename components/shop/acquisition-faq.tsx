"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    num: "01",
    title: "Careful Crating & Delivery",
    content:
      "Every work leaves the studio wrapped and crated by hand. Packing, courier, and timing are agreed with you directly before anything leaves the bench.",
  },
  {
    num: "02",
    title: "Studio Record & Certificate",
    content:
      "Every acquisition includes a signed certificate and the work's serial number recorded in the studio ledger. Your piece is always welcome back to the bench for re-waxing and care.",
  },
  {
    num: "03",
    title: "Private Studio Viewings & Bench Visits",
    content:
      "Collectors are welcome to visit the Collegeville, Pennsylvania studio by appointment to see works in daylight or discuss custom dimensions.",
  },
  {
    num: "04",
    title: "Direct Acquisition & Retainer Terms",
    content:
      "Pieces are acquired by studio invoice or a secure checkout link. Bespoke commissions begin with an agreed bench retainer, with progress photographs sent as the work takes shape.",
  },
];

export function AcquisitionFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section id="acquisition" className="py-16 sm:py-24 hairline-b bg-linen">
      <div className="shell max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-terracotta mb-2 font-bold">
            CUSTODIAL TRANSPARENCY &amp; LOGISTICS
          </p>
          <h2 className="font-serif text-3xl sm:text-5xl text-ink font-normal mb-3">
            Deed of Transfer &amp; Archival Crating
          </h2>
          <p className="text-sm text-umber max-w-lg mx-auto font-sans leading-relaxed">
            How original works are protected, authenticated, and delivered to private collections worldwide.
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

