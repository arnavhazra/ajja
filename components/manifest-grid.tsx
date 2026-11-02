"use client";

import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { ProductCard } from "./product-card";
import type { PublicProduct } from "@/lib/types";

gsap.registerPlugin(Flip);

export function ManifestGrid({ products }: { products: PublicProduct[] }) {
  const [filter, setFilter] = useState<"all" | "paintings" | "woodwork">("all");
  const gridRef = useRef<HTMLDivElement>(null);
  const pendingFlip = useRef<Flip.FlipState | null>(null);

  const applyFilter = (next: "all" | "paintings" | "woodwork") => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cards = gridRef.current?.querySelectorAll("[data-flip-id]");
    if (reduced || !cards?.length) {
      setFilter(next);
      return;
    }
    pendingFlip.current = Flip.getState(cards);
    setFilter(next);
  };

  useLayoutEffect(() => {
    const state = pendingFlip.current;
    pendingFlip.current = null;
    if (!state) return;
    Flip.from(state, {
      duration: 0.55,
      ease: "power3.inOut",
      absolute: true,
      fade: true,
      stagger: 0.015,
      onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out" }),
      onLeave: (els) => gsap.to(els, { autoAlpha: 0, y: -16, duration: 0.3, ease: "power2.in" }),
    });
  }, [filter]);

  const paintingsCount = products.filter((p) => p.categorySlug === "paintings").length;

  const woodworkCount = products.filter((p) => p.categorySlug === "woodwork").length;

  const filteredProducts = products.filter((p) => {
    if (filter === "all") return true;
    return p.categorySlug === filter;
  });

  return (
    <section id="manifest-grid" className="py-14 sm:py-20 hairline-b">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 hairline-b">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-terracotta mb-2">
            FOLIO 02 // CATALOGUE RAISONNÉ & CURRENT HOLDINGS
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl text-ink font-normal tracking-tight">
            Current Studio Manifest
          </h2>
        </div>

        <div className="max-w-md">
          <p className="text-xs sm:text-sm text-umber leading-relaxed">
            Displayed in native aspect ratios—vertical poured canvas panels, fluid pigments on wood, and handcrafted pine furniture. Each piece is strictly one of one.
          </p>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-umber mr-2">
            FILTER ARCHIVE:
          </span>
          <button
            type="button"
            onClick={() => applyFilter("all")}
            className={`px-3 py-1 rounded-sm font-mono text-[11px] uppercase transition-colors cursor-pointer ${
              filter === "all"
                ? "bg-ink text-linen"
                : "bg-bone text-umber hover:text-ink hairline-box"
            }`}
          >
            ● All Works ({products.length})
          </button>
          <button
            type="button"
            onClick={() => applyFilter("paintings")}
            className={`px-3 py-1 rounded-sm font-mono text-[11px] uppercase transition-colors cursor-pointer ${
              filter === "paintings"
                ? "bg-ink text-linen"
                : "bg-bone text-umber hover:text-ink hairline-box"
            }`}
          >
            Poured Paintings ({paintingsCount})
          </button>
          <button
            type="button"
            onClick={() => applyFilter("woodwork")}
            className={`px-3 py-1 rounded-sm font-mono text-[11px] uppercase transition-colors cursor-pointer ${
              filter === "woodwork"
                ? "bg-ink text-linen"
                : "bg-bone text-umber hover:text-ink hairline-box"
            }`}
          >
            Woodwork ({woodworkCount})
          </button>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px] text-umber">
          <span className="inline-block w-2 h-2 rounded-full bg-moss"></span>
          <span>CLICK ANY WORK TO INSPECT SPECIFICATIONS & STUDIO NOTES</span>
        </div>
      </div>

      {/* Staggered 3-Column Editorial Grid */}
      <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        {filteredProducts.map((product) => (
          <div key={product.id} data-flip-id={product.id}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Bespoke Architectural Commission Callout Banner */}
      <div className="mt-14 bg-bone hairline-box rounded-sm p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-terracotta font-bold">
              BESPOKE PATRONAGE
            </span>
            <span className="text-umber/40">•</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-umber">
              CUSTOM STUDIO COMMISSIONS
            </span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl text-ink mb-1">
            Seeking specific dimensions, wood species, or poured palettes?
          </h3>
          <p className="text-sm text-umber">
            The studio undertakes custom poured canvases and handcrafted woodwork pieces tailored to your architectural setting in Collegeville and across Pennsylvania.
          </p>
        </div>
        <a
          href="#inquiry-section"
          className="px-6 py-3.5 bg-ink text-linen font-mono text-xs uppercase tracking-widest rounded-sm hover:bg-terracotta transition-colors whitespace-nowrap"
        >
          [Inquire on Commission]
        </a>
      </div>
    </section>
  );
}
