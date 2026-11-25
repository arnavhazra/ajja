"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { pieceTitle } from "@/lib/piece-title";
import type { PublicProduct } from "@/lib/types";
import { PieceCard } from "./piece-card";

type FilterMode = "all" | "available" | "sold";
type SortMode = "catalogue" | "title" | "price-asc";

export function CategoryWall({ pieces }: { pieces: PublicProduct[] }) {
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sort, setSort] = useState<SortMode>("catalogue");

  const availableCount = useMemo(() => pieces.filter((p) => p.status !== "sold").length, [pieces]);
  const soldCount = pieces.length - availableCount;

  const visible = useMemo(() => {
    const filtered =
      filter === "available"
        ? pieces.filter((p) => p.status !== "sold")
        : filter === "sold"
          ? pieces.filter((p) => p.status === "sold")
          : pieces;

    if (sort === "catalogue") return filtered;
    const copy = [...filtered];
    if (sort === "title") {
      copy.sort((a, b) =>
        pieceTitle(a.title, a.categorySlug, a.attributes, a.id).localeCompare(
          pieceTitle(b.title, b.categorySlug, b.attributes, b.id),
        ),
      );
    } else if (sort === "price-asc") {
      copy.sort((a, b) => (a.priceMinor ?? Number.MAX_SAFE_INTEGER) - (b.priceMinor ?? Number.MAX_SAFE_INTEGER));
    }
    return copy;
  }, [pieces, filter, sort]);

  return (
    <>
      <section
        aria-label="Filter and sort pieces"
        className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-4"
      >
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Availability filter">
          <button
            type="button"
            onClick={() => setFilter("all")}
            aria-pressed={filter === "all"}
            className={cn(
              "ledger inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[2px] px-3.5 text-xs uppercase tracking-wider transition-colors",
              filter === "all" ? "bg-tar text-wall" : "text-tar hover:bg-wall-deep/70",
            )}
          >
            <span className="size-1.5 rounded-full bg-sap" aria-hidden="true" />
            <span>All works ({pieces.length})</span>
          </button>

          {availableCount > 0 ? (
            <button
              type="button"
              onClick={() => setFilter("available")}
              aria-pressed={filter === "available"}
              className={cn(
                "ledger inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[2px] px-3.5 text-xs uppercase tracking-wider transition-colors",
                filter === "available" ? "bg-tar text-wall" : "text-tar hover:bg-wall-deep/70",
              )}
            >
              <span className="size-1.5 rounded-full bg-ok" aria-hidden="true" />
              <span>Available direct ({availableCount})</span>
            </button>
          ) : null}

          {soldCount > 0 ? (
            <button
              type="button"
              onClick={() => setFilter("sold")}
              aria-pressed={filter === "sold"}
              className={cn(
                "ledger inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[2px] px-3.5 text-xs uppercase tracking-wider transition-colors",
                filter === "sold" ? "bg-tar text-wall" : "text-tar hover:bg-wall-deep/70",
              )}
            >
              <span className="size-1.5 rounded-full bg-sold" aria-hidden="true" />
              <span>Held in archive ({soldCount})</span>
            </button>
          ) : null}
        </div>

        <label className="ledger inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-wider text-tar-soft">
          <span>Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="min-h-11 cursor-pointer rounded-[2px] border border-line bg-wall px-2.5 text-xs uppercase text-tar outline-none focus:border-sap"
          >
            <option value="catalogue">Catalogue order</option>
            <option value="title">Title A–Z</option>
            <option value="price-asc">Price: low to high</option>
          </select>
        </label>
      </section>

      <div className="py-8 md:py-10">
        {visible.length ? (
          <div className="wall">
            {visible.map((product, index) => (
              <PieceCard
                key={product.id}
                product={product}
                index={index}
                priority={index < 3}
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 94vw"
              />
            ))}
          </div>
        ) : (
          <p className="type py-10 text-tar-soft">No pieces match this filter right now.</p>
        )}
      </div>
    </>
  );
}
