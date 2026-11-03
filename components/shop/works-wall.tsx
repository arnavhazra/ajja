"use client";

import { useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { cn } from "@/lib/cn";
import type { PublicProduct } from "@/lib/types";

type Filter = { key: string; label: string; count: number };

type Props = {
  products: PublicProduct[];
  children: React.ReactNode[];
};

/**
 * The full wall. Server-rendered cards arrive as children (same order as products);
 * filtering only hides and shows them, so every card is in the HTML without JS.
 */
export function WorksWall({ products, children }: Props) {
  const [active, setActive] = useState("all");
  const listRef = useRef<HTMLUListElement>(null);

  const filters = useMemo<Filter[]>(() => {
    const groups = new Map<string, Filter>();
    let available = 0;
    let sold = 0;
    for (const product of products) {
      if (product.status === "sold") sold += 1;
      else available += 1;
      if (product.categorySlug && product.categoryName) {
        const current = groups.get(product.categorySlug);
        groups.set(product.categorySlug, {
          key: product.categorySlug,
          label: product.categoryName,
          count: (current?.count ?? 0) + 1,
        });
      }
    }
    const list: Filter[] = [{ key: "all", label: "Everything", count: products.length }];
    if (available && sold) list.push({ key: "available", label: "Available", count: available });
    if (groups.size > 1) list.push(...groups.values());
    if (sold) list.push({ key: "sold", label: "Sold", count: sold });
    return list;
  }, [products]);

  const matches = (product: PublicProduct) => {
    if (active === "all") return true;
    if (active === "available") return product.status !== "sold";
    if (active === "sold") return product.status === "sold";
    return product.categorySlug === active;
  };

  const choose = (key: string) => {
    if (key === active) return;
    setActive(key);
    const list = listRef.current;
    if (!list || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    requestAnimationFrame(() => {
      gsap.fromTo(
        list.querySelectorAll("li:not([hidden])"),
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.7, ease: "expo.out", stagger: 0.03, overwrite: true },
      );
    });
  };

  const visible = products.filter(matches).length;

  return (
    <div>
      {filters.length > 1 ? (
        <div role="group" aria-label="Show" className="no-scrollbar -mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)] pb-1">
          {filters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              aria-pressed={active === filter.key}
              onClick={() => choose(filter.key)}
              className={cn(
                "btn min-h-11 shrink-0 px-4 text-sm",
                active === filter.key ? "btn-primary" : "btn-secondary",
              )}
            >
              {filter.label}
              <span className={cn("nums", active === filter.key ? "text-gesso/60" : "text-ink-soft")}>{filter.count}</span>
            </button>
          ))}
        </div>
      ) : null}
      <p className="sr-only" aria-live="polite">
        Showing {visible} of {products.length}
      </p>
      <ul ref={listRef} className="mt-10 columns-1 gap-x-[clamp(1rem,2.4vw,2.5rem)] sm:columns-2 lg:columns-3">
        {products.map((product, index) => (
          <li key={product.id} hidden={!matches(product)} className="mb-12 break-inside-avoid md:mb-16">
            {children[index]}
          </li>
        ))}
      </ul>
    </div>
  );
}
