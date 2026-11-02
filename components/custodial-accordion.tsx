"use client";

import { useState } from "react";

const SECTIONS = [
  {
    code: "SEC-01",
    title: "Direct Studio Collection & Pennsylvania Delivery",
    content:
      "All works are available for private studio inspection and collection in Collegeville, Pennsylvania by appointment. For collectors across the greater Philadelphia and Pennsylvania area, white-glove hand delivery can be arranged directly with the family.",
    specs: [
      "STUDIO LOCATION: COLLEGEVILLE, PA",
      "VISITS: BY APPOINTMENT",
      "DIRECT STUDIO HAND-OFF",
    ],
  },
  {
    code: "SEC-02",
    title: "Direct Artist Dialogue & Deed of Provenance",
    content:
      "Every piece is purchased directly from the family studio. Each acquisition is accompanied by a hand-signed Certificate of Provenance detailing completion date, materials, and finish specifications, with its archive number permanently retired in the studio ledger.",
    specs: [
      "DEED: HAND-SIGNED PROVENANCE",
      "REGISTRY: RETIRED STUDIO NUMBER",
      "NO THIRD-PARTY INTERMEDIARIES",
    ],
  },
  {
    code: "SEC-03",
    title: "Custom Protection & Insured Passage",
    content:
      "When regional pickup or studio hand-off is not possible, our studio prepares custom cushioned crating tailored to the exact geometry of your artwork. Shipped with tracking and transit insurance directly to your residence.",
    specs: [
      "PACKING: CUSTOM FIT CRATING",
      "TRACKING: DIRECT STUDIO CONFIRMATION",
      "PAYMENT: ARRANGED PERSONALLY OFF-SITE",
    ],
  },
];

export function CustodialAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="transfer" className="py-16 sm:py-20 hairline-b max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-terracotta mb-2">
          CUSTODIAL TRANSPARENCY & LOGISTICS
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl text-ink font-normal mb-2">
          Deed of Transfer & Studio Collection
        </h2>
        <p className="text-sm text-umber max-w-xl mx-auto">
          How each one-of-a-kind work is authenticated, documented, and collected from our Collegeville studio.
        </p>
      </div>

      <div className="space-y-3">
        {SECTIONS.map((sec, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={sec.code} className="bg-bone hairline-box rounded-sm overflow-hidden">
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full px-6 py-5 flex items-center justify-between text-left cursor-pointer hover:bg-bone-dark/50 transition-colors"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-terracotta font-bold">{sec.code}</span>
                  <span className="font-serif text-xl sm:text-2xl text-ink">{sec.title}</span>
                </div>
                <span className="font-mono text-lg text-umber">{isOpen ? "−" : "+"}</span>
              </button>

              {isOpen ? (
                <div className="px-6 pb-6 pt-2 hairline-t bg-linen/50 text-sm text-umber space-y-3">
                  <p className="leading-relaxed">{sec.content}</p>
                  <div className="flex flex-wrap gap-4 sm:gap-6 pt-2 font-mono text-[11px] text-ink">
                    {sec.specs.map((spec) => (
                      <span key={spec}>• {spec}</span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
