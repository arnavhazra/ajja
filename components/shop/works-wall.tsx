"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PieceCard } from "./piece-card";
import { useWallFilter } from "./wall-filter";
import type { PublicProduct } from "@/lib/types";

type Filter = { key: string; label: string; count: number };

/** Card span driven by the photo's aspect — the wall hangs mixed sizes. */
function spanFor(product: PublicProduct) {
  const cover = product.images[0];
  const ratio = cover?.width && cover?.height ? cover.width / cover.height : 0.8;
  if (ratio >= 1.45) return "lg:col-span-2";
  return "";
}

export function WorksWall({ products }: { products: PublicProduct[] }) {
  const [active, setActive] = useState("all");
  const { pigment, matches } = useWallFilter();

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
    const list: Filter[] = [{ key: "all", label: "All", count: products.length }];
    if (groups.size > 0) list.push(...groups.values());
    if (sold > 0) list.push({ key: "sold", label: "Sold", count: sold });
    return list;
  }, [products]);

  const keep = (product: PublicProduct) => {
    if (!matches(product.pigment)) return false;
    if (active === "all") return true;
    if (active === "sold") return product.status === "sold";
    return product.categorySlug === active;
  };

  const seen = new Set<string>();
  const filtered = products.filter(keep).filter((product) => (seen.has(product.id) ? false : (seen.add(product.id), true)));

  return (
    <section id="works" className="hairline-b bg-gesso py-14 sm:py-20">
      <div className="shell">
        <div className="mb-10 flex flex-col justify-between gap-6 pb-6 hairline-b md:flex-row md:items-end">
          <div>
            <p className="tag text-pour">01 — In the studio now</p>
            <h2 className="display mt-2 text-4xl sm:text-6xl">The works</h2>
          </div>
          <p className="caption max-w-md text-lg">
            Each piece hangs as it was photographed. Choose a work to see it closer, or ask the studio about it.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-2">
          <span className="tag mr-2">Show:</span>
          {filters.map((filter) => {
            const isActive = active === filter.key;
            return (
              <button
                key={filter.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActive(filter.key)}
                className={`tag inline-flex min-h-11 items-center rounded-[2px] px-3 transition-colors cursor-pointer ${
                  isActive ? "bg-ink font-bold text-gesso" : "hairline-box text-ink-soft hover:text-ink"
                }`}
              >
                {filter.label} <span className="nums ml-1">({filter.count})</span>
              </button>
            );
          })}
          {pigment ? (
            <span className="tag inline-flex min-h-11 items-center gap-2 text-ink">
              <span className="inline-block size-3 rounded-full" style={{ background: pigment }} />
              filtered by a colour
            </span>
          ) : null}
        </div>

        {/* Staggered editorial wall — spans follow the photographs */}
        <div className="grid grid-cols-1 items-start gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((product, index) => (
            <PieceCard
              key={product.id}
              product={product}
              index={index}
              priority={index < 3}
              className={spanFor(product)}
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
            />
          ))}
        </div>
        {filtered.length === 0 ? (
          <p className="caption mt-4 text-lg">Nothing on the wall matches that yet — try another colour or filter.</p>
        ) : null}

        <div className="mt-14 flex flex-col items-start justify-between gap-6 hairline-box bg-card p-6 sm:p-8 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <p className="tag text-pour">Custom work</p>
            <h3 className="display-wide mt-1.5 text-2xl sm:text-3xl">Need a different size, or a piece made for you?</h3>
            <p className="caption mt-1 text-lg">
              Tell the studio what you have in mind — a size, a wood, a place it will live — and we will tell you what is possible.
            </p>
          </div>
          <Link href="/#inquire" className="btn btn-primary min-h-11">
            Ask about a commission
          </Link>
        </div>
      </div>
    </section>
  );
}
