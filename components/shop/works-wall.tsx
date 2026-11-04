"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PieceCard } from "./piece-card";
import type { PublicProduct } from "@/lib/types";

type Filter = { key: string; label: string; count: number };

type Props = {
  products: PublicProduct[];
  children?: React.ReactNode;
};

export function WorksWall({ products }: Props) {
  const [active, setActive] = useState("all");

  const filters = useMemo<Filter[]>(() => {
    const groups = new Map<string, Filter>();
    let sold = 0;

    for (const product of products) {
      if (product.status === "sold") sold += 1;
      if (product.categorySlug && product.categoryName) {
        const current = groups.get(product.categorySlug);
        groups.set(product.categorySlug, {
          key: product.categorySlug,
          label: product.categoryName,
          count: (current?.count ?? 0) + 1,
        });
      }
    }

    const list: Filter[] = [{ key: "all", label: "All Works", count: products.length }];
    if (groups.size > 0) list.push(...groups.values());
    if (sold > 0) list.push({ key: "sold", label: "Reserved Archive", count: sold });
    return list;
  }, [products]);

  const matches = (product: PublicProduct) => {
    if (active === "all") return true;
    if (active === "sold") return product.status === "sold";
    if (active === "available") return product.status !== "sold";
    return product.categorySlug === active;
  };

  const filtered = products.filter(matches);

  return (
    <section id="works" className="py-14 sm:py-20 hairline-b bg-linen">
      <div className="shell">
        {/* Section Header & Active Subtitle */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 hairline-b">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-terracotta mb-2 font-bold">
              FOLIO 02 // CATALOGUE RAISONNÉ &amp; CURRENT HOLDINGS
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl text-ink font-normal tracking-tight">
              Current Studio Manifest
            </h2>
          </div>

          <div className="max-w-md">
            <p className="text-xs sm:text-sm text-umber leading-relaxed font-sans">
              Displayed in uncropped native aspect ratios—square ceramic pedestals (1:1), vertical linen canvases (3:4), and horizontal timber carvings (4:3). Click any work to inspect fine surface detail and in-room scale.
            </p>
          </div>
        </div>

        {/* Filter Bar Sub-Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-umber mr-2">
              FILTER ARCHIVE:
            </span>
            {filters.map((filter) => {
              const isActive = active === filter.key;
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActive(filter.key)}
                  className={`px-3 py-1 rounded-sm font-mono text-[11px] uppercase cursor-pointer transition-colors ${
                    isActive
                      ? "bg-ink text-linen font-bold shadow-sm"
                      : "bg-bone text-umber hover:text-ink hairline-box"
                  }`}
                >
                  {isActive ? "● " : ""}{filter.label} ({filter.count})
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px] text-umber">
            <span className="inline-block size-2 rounded-full bg-terracotta" />
            <span>CLICK ANY SPECIMEN FOR IN-ROOM SCALE &amp; DOSSIER</span>
          </div>
        </div>

        {/* Staggered 3-Column Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          {filtered.map((product, index) => (
            <PieceCard
              key={product.id}
              product={product}
              index={index}
              priority={index < 3}
            />
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
                3 COMMISSIONS PER SEASON
              </span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl text-ink mb-1">
              Seeking specific architectural dimensions or timber species?
            </h3>
            <p className="text-sm text-umber font-sans leading-relaxed">
              Ajja undertakes three custom woodworking or canvas commissions each cycle using naturally fallen rosewood, teak, and jackfruit logs seasoned in our studio yard.
            </p>
          </div>
          <Link
            href="/#inquire"
            className="px-6 py-3.5 bg-ink text-linen font-mono text-xs uppercase tracking-widest rounded-sm hover:bg-terracotta transition-colors whitespace-nowrap shadow-sm"
          >
            [Inquire on Commission]
          </Link>
        </div>
      </div>
    </section>
  );
}
