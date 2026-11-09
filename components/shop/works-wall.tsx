"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/cn";
import { pourData, pourOf } from "@/lib/pour";
import type { PublicProduct } from "@/lib/types";
import { PieceCard } from "./piece-card";

type Filter = { key: string; label: string; count: number };

const FEATURE_EVERY = 5;

/**
 * The hang: every piece at its own proportions, centred on one hanging line
 * per row. Every fifth piece hangs wide across two columns, alternating sides.
 * Filters reorder the wall with GSAP Flip.
 */
export function WorksWall({ products }: { products: PublicProduct[] }) {
  const [active, setActive] = useState("all");
  const wallRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);

  const filters = useMemo<Filter[]>(() => {
    const groups = new Map<string, Filter>();
    let sold = 0;
    let available = 0;
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
    const list: Filter[] = [{ key: "all", label: "All", count: products.length }];
    if (sold > 0 && available > 0) list.push({ key: "available", label: "Available", count: available });
    if (groups.size > 1) list.push(...groups.values());
    if (sold > 0) list.push({ key: "sold", label: "Sold", count: sold });
    return list;
  }, [products]);

  const filtered = useMemo(() => {
    const seen = new Set<string>();
    return products.filter((product) => {
      if (seen.has(product.id)) return false;
      seen.add(product.id);
      if (active === "all") return true;
      if (active === "available") return product.status !== "sold";
      if (active === "sold") return product.status === "sold";
      return product.categorySlug === active;
    });
  }, [products, active]);

  const choose = (key: string) => {
    if (key === active) return;
    const wall = wallRef.current;
    if (wall && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.registerPlugin(Flip);
      flipState.current = Flip.getState(wall.querySelectorAll("[data-flip-id]"));
    }
    setActive(key);
  };

  useLayoutEffect(() => {
    const bar = barRef.current;
    const pill = pillRef.current;
    const on = bar?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (bar && pill && on) {
      pill.style.width = `${on.offsetWidth}px`;
      pill.style.transform = `translateX(${on.offsetLeft}px)`;
      pill.dataset.ready = "true";
    }
    const state = flipState.current;
    const wall = wallRef.current;
    if (!state || !wall) return;
    flipState.current = null;
    // Freshly mounted pieces skip their scroll reveal; Flip fades them in instead.
    wall.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("revealed"));
    Flip.from(state, {
      targets: wall.querySelectorAll("[data-flip-id]"),
      duration: 0.7,
      ease: "power3.inOut",
      stagger: 0.02,
      absolute: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.5, delay: 0.25 }),
    });
  }, [active]);

  // Filtering changes the wall's height; everything pinned below it needs new start points.
  useLayoutEffect(() => {
    if (!active) return;
    let frame = 0;
    const refresh = () => {
      frame = requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        requestAnimationFrame(() => ScrollTrigger.refresh());
      });
    };
    refresh();
    const timer = window.setTimeout(refresh, 300);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [active]);

  let feature = 0;

  return (
    <section id="works" className="pr-section pr-works scroll-mt-[60px]" aria-labelledby="works-title">
      <div className="shell">
        <header className="pr-head">
          <div>
            <p className="pr-label">The wall</p>
            <h2 id="works-title" className="pr-h2" data-reveal="">
              The works <sup className="pr-count nums">{products.length}</sup>
            </h2>
          </div>
          <p className="pr-head-note">
            Each piece hangs at its own proportions, photographed as it is. Choose a work to see it closer, or ask the
            studio about it.
          </p>
        </header>
      </div>

      {filters.length > 1 ? (
        <div className="pr-filterbar">
          <div className="shell">
            <div ref={barRef} className="pr-filters" role="group" aria-label="Show only">
              <span ref={pillRef} className="pr-pill" aria-hidden="true" />
              {filters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  className="pr-filter"
                  aria-pressed={active === filter.key}
                  onClick={() => choose(filter.key)}
                >
                  {filter.label} <span className="nums">{filter.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="shell">
        <div ref={wallRef} className="pr-hang">
          {filtered.map((product, index) => {
            const wide = index % FEATURE_EVERY === 0 && filtered.length > 2;
            const side = wide ? (feature++ % 2 === 0 ? "start" : "end") : undefined;
            return (
              <div
                key={product.id}
                className={cn("pr-slot", wide && "is-wide")}
                data-side={side}
                {...(wide ? pourData(pourOf(product.pigment, product.pigmentInk)) : {})}
              >
                <PieceCard
                  product={product}
                  index={index}
                  priority={index < 2}
                  className={wide ? "is-wide" : undefined}
                  sizes={
                    wide
                      ? "(min-width: 600px) 64vw, 94vw"
                      : "(min-width: 960px) 30vw, (min-width: 600px) 46vw, 94vw"
                  }
                />
              </div>
            );
          })}
        </div>
        {filtered.length === 0 ? <p className="pr-empty">Nothing on the wall matches that yet.</p> : null}

        <p className="pr-more">
          Need a different size, or a piece made for you? Tell the studio what you have in mind.{" "}
          <Link href="#inquire" className="pr-link">
            Ask about a commission
          </Link>
        </p>
      </div>
    </section>
  );
}
