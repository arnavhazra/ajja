"use client";

import { pieceRef, pieceTitle } from "@/lib/piece-title";
import { dedupeByPigment, sortByHue } from "@/lib/pigment-math";
import type { PublicProduct } from "@/lib/types";
import { useWallFilter } from "./wall-filter";

/** The shelf — one jar per piece colour. Pick a jar and the wall keeps only its family. */
export function ColourIndex({ products }: { products: PublicProduct[] }) {
  const { pigment, setPigment } = useWallFilter();
  const unique = sortByHue(dedupeByPigment(products, (product) => product.pigment), (product) => product.pigment);
  if (unique.length < 3) return null;

  const choose = (hex: string) => {
    setPigment(pigment === hex ? null : hex);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("works")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <section id="shelf" aria-labelledby="shelf-title" className="hairline-b scroll-mt-[78px]">
      <div className="shell">
        <div className="sec-head">
          <div>
            <p className="kicker">the pigment shelf</p>
            <h2 id="shelf-title" className="disp mt-[10px]">
              Colour, <span className="sten">jar</span> by jar
            </h2>
          </div>
          <p className="sub type">Each jar holds the colour of one piece. Pick a jar and the wall keeps only its family.</p>
        </div>
        <div className="jars" role="group" aria-label="Pieces by colour">
          {unique.map((product) => {
            const title = pieceTitle(product.title, product.categorySlug, product.attributes, product.id);
            const active = pigment === product.pigment;
            return (
              <button
                key={product.id}
                type="button"
                className="jar"
                style={{ "--pig": product.pigment } as React.CSSProperties}
                aria-pressed={active}
                aria-label={`${title}, colour ${product.pigment.toUpperCase()}${active ? ", filtering the wall" : ""}`}
                onClick={() => choose(product.pigment)}
              >
                <span className="jar-sw" style={{ background: product.pigment }} aria-hidden="true" />
                <span className="jar-tx" aria-hidden="true">
                  <b>{product.pigment.toUpperCase()}</b>
                  no. {pieceRef(product.id)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
