"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { PieceCard } from "./piece-card";
import { useWallFilter } from "./wall-filter";
import type { PublicProduct } from "@/lib/types";

type Filter = { key: string; label: string; count: number };

export function WorksWall({ products }: { products: PublicProduct[] }) {
  const [active, setActive] = useState("all");
  const { pigment, setPigment, matches } = useWallFilter();

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
    const list: Filter[] = [{ key: "all", label: "all", count: products.length }];
    if (groups.size > 0) list.push(...groups.values());
    if (sold > 0) list.push({ key: "sold", label: "sold", count: sold });
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
    <section id="works" className="hairline-b scroll-mt-[78px]">
      <div className="shell">
        <div className="sec-head">
          <div>
            <p className="kicker">the wall</p>
            <h2 className="disp mt-[10px]">
              The works<span className="text-sap">.</span>
            </h2>
          </div>
          <p className="sub type">
            Each piece hangs as it was photographed. Choose a work to see it closer, or ask the studio about it.
          </p>
        </div>

        <div className="filters" role="group" aria-label="Hang only">
          <span className="py-[6px] text-tar-soft">hang:</span>
          {filters.map((filter) => {
            const isActive = active === filter.key;
            return (
              <button
                key={filter.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActive(filter.key)}
                className={cn("flt", isActive && "on")}
              >
                {filter.label.toLowerCase()} ({filter.count})
              </button>
            );
          })}
          {pigment ? (
            <span className="inline-flex min-h-11 items-center gap-2 text-sm text-tar">
              <span className="inline-block size-3" style={{ background: pigment }} aria-hidden="true" />
              filtered by a colour
              <button
                type="button"
                className="inline-flex min-h-11 items-center px-1 underline underline-offset-4 cursor-pointer"
                onClick={() => setPigment(null)}
              >
                show every colour
              </button>
            </span>
          ) : null}
        </div>

        {/* The wall — photographs at their real proportions, typed captions */}
        <div className="wall">
          {filtered.map((product, index) => (
            <PieceCard
              key={product.id}
              product={product}
              index={index}
              priority={index < 3}
              sizes="(min-width: 1180px) 22vw, (min-width: 900px) 30vw, (min-width: 560px) 46vw, 94vw"
            />
          ))}
        </div>
        {filtered.length === 0 ? (
          <p className="type mt-4 text-sm text-tar-soft">Nothing on the wall matches that yet — try another colour or filter.</p>
        ) : null}

        <p className="more type">
          need a different size, or a piece made for you? tell the studio what you have in mind — a size, a wood, a
          place it will live — and we will tell you what is possible.{" "}
          <Link href="#inquire">ask about a commission →</Link>
        </p>
      </div>
    </section>
  );
}
