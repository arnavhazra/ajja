"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { hasRealTitle, pieceKind, pieceRef, pieceTitle } from "@/lib/piece-title";
import { dedupeByPigment, sortByHue } from "@/lib/pigment-math";
import { paintPour, pourFromDataset, pourData, pourOf } from "@/lib/pour";
import type { PublicProduct } from "@/lib/types";

/** Same values as pourData, under names PourMotion's scroll tint does not watch. */
function swatchData(pour: ReturnType<typeof pourOf>) {
  const data = pourData(pour);
  return {
    "data-swatch-pour": data["data-pour"],
    "data-swatch-pour-ink": data["data-pour-ink"],
    "data-swatch-pour-text": data["data-pour-text"],
    "data-swatch-pour-text-night": data["data-pour-text-night"],
  };
}

function swatchPour(data: DOMStringMap) {
  return pourFromDataset({
    pour: data.swatchPour,
    pourInk: data.swatchPourInk,
    pourText: data.swatchPourText,
    pourTextNight: data.swatchPourTextNight,
  });
}

/**
 * The colour run: every pigment on the wall as a band you can walk through.
 * On fine pointers it pins and slides; anywhere it reads as a strip. Hover or
 * focus a swatch to preview the piece and lend the page its colour.
 */
export function ColourIndex({ products }: { products: PublicProduct[] }) {
  const unique = dedupeByPigment(products, (product) => product.pigment);
  const ordered = sortByHue(unique, (product) => product.pigment);
  const trackRef = useRef<HTMLDivElement>(null);
  const leaving = useRef<number | null>(null);

  // Pointer previews follow real pointer movement, never keyboard focus.
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return;
    const track = trackRef.current;
    if (!track) return;
    const swatches = Array.from(track.querySelectorAll<HTMLElement>("[data-swatch]"));
    let last: HTMLElement | null = null;
    const show = (el: HTMLElement) => {
      if (last === el) return;
      last?.removeAttribute("data-preview");
      el.setAttribute("data-preview", "");
      last = el;
      const pour = swatchPour(el.dataset);
      if (pour) paintPour(pour);
    };
    const onMove = (event: PointerEvent) => {
      let best: HTMLElement | null = null;
      let distance = Infinity;
      for (const el of swatches) {
        const box = el.getBoundingClientRect();
        const d = Math.hypot(event.clientX - (box.left + box.width / 2), event.clientY - (box.top + box.height / 2));
        if (d < distance) {
          distance = d;
          best = el;
        }
      }
      if (best) show(best);
    };
    const onLeave = () => {
      if (leaving.current) window.clearTimeout(leaving.current);
      leaving.current = window.setTimeout(() => {
        last?.removeAttribute("data-preview");
        last = null;
      }, 120);
    };
    track.addEventListener("pointermove", onMove, { passive: true });
    track.addEventListener("pointerleave", onLeave);
    return () => {
      track.removeEventListener("pointermove", onMove);
      track.removeEventListener("pointerleave", onLeave);
      if (leaving.current) window.clearTimeout(leaving.current);
    };
  }, [ordered.length]);

  if (ordered.length < 3) return null;

  return (
    <section
      id="shelf"
      className="pr-run shell scroll-mt-[60px]"
      aria-labelledby="run-title"
      data-run=""
      style={{ "--swatches": ordered.length } as React.CSSProperties}
    >
      <div className="pr-run-head">
        <p className="pr-label">The colour run</p>
        <h2 id="run-title" className="pr-h2">
          Every pigment on the wall
        </h2>
        <p className="pr-head-note">
          Walk the collection by colour. Point at a swatch to see its piece; choose one to open it.
        </p>
      </div>
      <div className="pr-run-viewport">
        <div className="pr-run-track" data-run-track="" ref={trackRef}>
          {ordered.map((product) => {
            const title = pieceTitle(product.title, product.categorySlug, product.attributes, product.id);
            const named = hasRealTitle(product.title);
            const kind = pieceKind(product.categoryName, product.attributes);
            const cover = product.images[0];
            const pour = pourOf(product.pigment, product.pigmentInk);
            const label = `${named ? title : `No. ${pieceRef(product.id)}`}${kind ? `, ${kind}` : ""}`;
            return (
              <Link
                key={product.id}
                href={`/p/${product.slug}`}
                className="pr-swatch"
                data-swatch=""
                aria-label={`${label}, colour ${product.pigment.toUpperCase()}`}
                {...swatchData(pour)}
                style={{ background: pour.pour, color: pour.ink }}
              >
                <span className="pr-swatch-tag">
                  <span className="pr-swatch-hex nums">{product.pigment.toUpperCase()}</span>
                  <span className="pr-swatch-ref nums">No. {pieceRef(product.id)}</span>
                </span>
                <span className="pr-swatch-preview" aria-hidden="true">
                  {cover ? (
                    <Image
                      src={cover.url}
                      alt=""
                      width={cover.width ?? 240}
                      height={cover.height ?? 300}
                      sizes="240px"
                      className="object-cover"
                      style={{ objectPosition: `${(cover.focalX ?? 0.5) * 100}% ${(cover.focalY ?? 0.5) * 100}%` }}
                    />
                  ) : null}
                  <span className="pr-swatch-preview-label">
                    {named ? title : `No. ${pieceRef(product.id)}`}
                    {kind ? ` — ${kind}` : ""}
                  </span>
                </span>
              </Link>
            );
          })}
          <span className="pr-swatch-end" aria-hidden="true">
            <span className="pr-label">{ordered.length} pigments</span>
          </span>
        </div>
      </div>
    </section>
  );
}
