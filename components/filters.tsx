"use client";

import { useEffect, useRef } from "react";
import type { PublicCategory } from "@/lib/types";
import type { ShopQuery } from "@/lib/shop-query";

const CONDITIONS = ["", "New", "Excellent", "Good", "Fair", "Made to order"];

export function Filters({ query, categories }: { query: ShopQuery; categories: PublicCategory[] }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    const wide = window.matchMedia("(min-width: 768px)");
    function place() {
      if (!node) return;
      if (wide.matches) {
        if (!node.open) {
          node.show();
          const active = document.activeElement;
          if (active instanceof HTMLElement && node.contains(active)) active.blur();
        }
        return;
      }
      if (node.open) node.close();
    }
    place();
    wide.addEventListener("change", place);
    return () => wide.removeEventListener("change", place);
  }, []);
  return (
    <form action="/shop" className="grid gap-5 border-t border-line pt-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <label className="grid flex-1 gap-1.5 text-ink">
          Search shop
          <input className="field" name="q" defaultValue={query.q} placeholder="Search pieces…" />
        </label>
        <div className="flex gap-2">
          <button className="btn btn-primary" type="submit">
            Search
          </button>
          <button type="button" className="btn btn-secondary md:hidden" onClick={() => dialog.current?.showModal()}>
            Filters
          </button>
        </div>
      </div>
      <dialog ref={dialog} className="filter-dialog sheet">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1.5 text-ink">
            Group
            <select className="field" name="category" defaultValue={query.category}>
              <option value="">All groups</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-ink">
            Condition
            <select className="field" name="condition" defaultValue={query.condition}>
              {CONDITIONS.map((condition) => (
                <option key={condition || "any"} value={condition}>
                  {condition || "Any condition"}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-ink">
            Availability
            <select className="field" name="availability" defaultValue={query.availability}>
              <option value="">All</option>
              <option value="available">For sale</option>
              <option value="sold">Sold</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-ink">
            Sort
            <select className="field" name="sort" defaultValue={query.sort}>
              <option value="newest">Newest</option>
              <option value="price-asc">Price, low to high</option>
              <option value="price-desc">Price, high to low</option>
              <option value="featured">Featured</option>
            </select>
          </label>
          <fieldset className="flex flex-wrap gap-2 md:col-span-2">
            <legend className="mb-1 text-ink">Price</legend>
            {[25, 50, 100, 200].map((amount) => (
              <a key={amount} className="btn btn-quiet nums" href={`/shop?max=${amount}`}>
                Under ${amount}
              </a>
            ))}
          </fieldset>
          <label className="grid gap-1.5 text-ink">
            Minimum dollars
            <input className="field nums" name="min" inputMode="decimal" defaultValue={query.min != null ? String(query.min / 100) : ""} />
          </label>
          <label className="grid gap-1.5 text-ink">
            Maximum dollars
            <input className="field nums" name="max" inputMode="decimal" defaultValue={query.max != null ? String(query.max / 100) : ""} />
          </label>
        </div>
        <div className="mt-5 flex gap-3 border-t border-line pt-4 md:border-0 md:pt-0">
          <button className="btn btn-primary" type="submit">
            Show pieces
          </button>
          <button type="button" className="btn btn-quiet md:hidden" onClick={() => dialog.current?.close()}>
            Close
          </button>
        </div>
      </dialog>
    </form>
  );
}
