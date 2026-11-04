"use client";

import Image from "next/image";
import type { PublicProduct } from "@/lib/types";

export function AtelierSection({ detail }: { detail?: PublicProduct | null }) {
  const photoUrl =
    detail?.images[0]?.url ||
    "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=85";

  return (
    <section id="atelier" className="py-16 sm:py-24 hairline-b bg-linen">
      <div className="shell grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left Column (6 cols): Archival Photograph of Artisan's Hands & Chisel */}
        <div className="lg:col-span-6">
          <div className="bg-bone p-4 sm:p-6 hairline-box rounded-sm shadow-sm">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-ink">
              <Image
                src={photoUrl}
                alt="Archival photograph of Ajja Narayan Rao's hands holding carving chisels in natural window light"
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover grayscale contrast-125 brightness-95 hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-ink/10 pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-linen/90 font-mono text-[10px] tracking-widest uppercase">
                <span>MYSORE ATELIER EAST WING</span>
                <span>SILVER GELATIN PRINT #71</span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-umber">
              <span>PHOTO ARCHIVE — CHAMUNDI FOOTHILLS BENCH</span>
              <span>HAND-FORGED 18MM KANNA &amp; GOUGE</span>
            </div>
          </div>
        </div>

        {/* Right Column (6 cols): Maker's Credo & Signature */}
        <div className="lg:col-span-6 lg:pl-4">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-6 h-[1px] bg-terracotta" />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-terracotta font-bold">
              THE MAKER&apos;S CREDO // AJJA NARAYAN RAO (B. 1946)
            </span>
          </div>

          <h2 className="font-serif text-4xl sm:text-5xl text-ink font-normal leading-[1.12] mb-6">
            On letting the wood decide the grain.
          </h2>

          <blockquote className="font-serif italic text-2xl sm:text-[28px] text-ink/90 leading-[1.38] pl-5 border-l-2 border-terracotta mb-8">
            &ldquo;When I was twenty, I tried to force the timber to submit to my drawing. Now that I am eighty, I know the tree has lived three hundred monsoons longer than I have. My only task is to clear away the silence so its grain can speak.&rdquo;
          </blockquote>

          <div className="space-y-4 text-sm sm:text-base text-umber leading-[1.75] mb-10 font-sans">
            <p>
              Nothing in the studio has ever known mechanical sandpaper speed, synthetic polyurethane, or chemical stains. Timber surfaces are trued using hand-forged smoothing planes (<em className="text-ink font-serif text-lg">kanna</em>) and local high-carbon steel gouges, then burnished with dried horsetail reed stalks and unrefined cold-pressed sesame oil.
            </p>
            <p>
              Each poured painting is built with raw mineral pigments mulled by hand with aged linseed oil and dammar resin, curing over months to form an unrepeatable crystalline edge.
            </p>
          </div>

          {/* Two Key Custodial Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 hairline-t hairline-b mb-8">
            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-ink font-bold mb-1.5">
                01. Zero Chemical Binders
              </h3>
              <p className="text-xs text-umber leading-relaxed font-sans">
                Joined solely through sliding dovetails, mortise-and-tenon, and seasoned rosewood pins. Pigments are mulled with natural tree resins.
              </p>
            </div>
            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-ink font-bold mb-1.5">
                02. Perpetual Studio Custody
              </h3>
              <p className="text-xs text-umber leading-relaxed font-sans">
                Every artifact carries a lifetime re-waxing and conservation guarantee at our bench at zero cost to the custodian.
              </p>
            </div>
          </div>

          {/* Handwritten Digital Signature + Embossed Mysore Guild Wax Seal SVG */}
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <svg className="h-14 w-56 text-ink mb-1" viewBox="0 0 280 70" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Handwritten signature of Ajja Narayan Rao">
                <path d="M18 52C26 36 38 14 44 14C48 14 42 46 39 54C37 58 45 42 54 36C62 31 64 46 70 46C76 46 82 33 88 33C93 33 91 58 84 63C77 67 74 56 84 48C94 40 105 32 110 34C115 36 108 58 103 62C98 66 95 53 106 45C117 37 126 35 130 41C134 47 142 36 146 39C150 42 156 45 165 42M24 36C42 34 66 30 82 28M182 48C186 35 194 18 198 18C202 18 201 38 206 44C211 50 218 30 222 24C225 35 228 45 236 44C244 43 249 34 256 35C263 36 260 45 268 44" stroke="#1E1B18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="94" cy="24" r="1.5" fill="#1E1B18"/>
                <circle cx="114" cy="23" r="1.5" fill="#1E1B18"/>
                <path d="M16 60C75 56 175 53 265 51" stroke="#C2593F" strokeWidth="1" strokeLinecap="round" strokeDasharray="3 3"/>
              </svg>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-umber">
                AJJA NARAYAN RAO • MASTER OF THE ATELIER
              </p>
            </div>

            {/* Embossed Terracotta Guild Wax Seal */}
            <div className="flex items-center gap-3 bg-bone px-4 py-2.5 rounded-sm hairline-box">
              <svg className="w-11 h-11 text-terracotta shrink-0" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="32" r="29" fill="#C2593F" fillOpacity="0.14" stroke="#C2593F" strokeWidth="1.5" strokeDasharray="2 2"/>
                <circle cx="32" cy="32" r="23" stroke="#C2593F" strokeWidth="1.2"/>
                <path d="M32 16L36 26L46 28L38 35L40 45L32 39L24 45L26 35L18 28L28 26L32 16Z" stroke="#C2593F" strokeWidth="1.2" fill="#C2593F" fillOpacity="0.2"/>
                <text x="32" y="35" textAnchor="middle" fill="#C2593F" fontFamily="monospace" fontSize="7" fontWeight="bold">1964</text>
              </svg>
              <div className="font-mono text-[10px] leading-tight">
                <span className="block text-ink font-bold uppercase">CRAFTSMEN GUILD</span>
                <span className="text-umber">SEAL NO. KA-MYS-0194</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
