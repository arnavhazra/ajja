"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    num: "01",
    title: "Museum-Grade Crating & White-Glove Logistics",
    content:
      "All works depart the studio encased in bespoke archival timber crates with acid-free glassine facing and 50mm high-density polyethylene impact damping. Shipments are fully insured with climate-monitored courier handling to private residences and gallery collections worldwide.",
  },
  {
    num: "02",
    title: "Physical Deed of Transfer & Ledger Registry",
    content:
      "Every acquisition includes a signed, wax-sealed Certificate of Custody on handmade cotton-rag paper. The work's unique serial number is recorded in the studio archive ledger, granting lifetime bench re-waxing and conservation rights.",
  },
  {
    num: "03",
    title: "Private Studio Viewings & Bench Visits",
    content:
      "Curators and patrons are welcome to visit our Collegeville, Pennsylvania studio or our Chamundi foothills workshop by appointment to examine works in daylight or discuss custom dimensions.",
  },
  {
    num: "04",
    title: "Direct Acquisition & Retainer Terms",
    content:
      "Pieces can be acquired directly via studio invoice, wire transfer, or secure Stripe checkout. Bespoke architectural commissions require a 50% bench retainer with photographic progress dispatches sent throughout the carving and curing cycles.",
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
