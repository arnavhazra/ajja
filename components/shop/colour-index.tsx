"use client";

import { pieceTitle } from "@/lib/piece-title";
import { dedupeByPigment, sortByHue } from "@/lib/pigment-math";
import type { PublicProduct } from "@/lib/types";
import { useWallFilter } from "./wall-filter";

/** The pigment shelf — swatch jars by hue. Pick one and the wall keeps only that colour. */
export function ColourIndex({ products }: { products: PublicProduct[] }) {
  const { pigment, setPigment } = useWallFilter();
  const unique = sortByHue(dedupeByPigment(products, (product) => product.pigment), (product) => product.pigment);
  if (unique.length < 3) return null;

  const choose = (hex: string) => {
    setPigment(pigment === hex ? null : hex);
    document.getElementById("works")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section aria-labelledby="colour-title" className="hairline-b py-16 md:py-24">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="tag text-pour">02 — The pigment shelf</p>
            <h2 id="colour-title" className="display-wide mt-2 text-3xl md:text-4xl">
              Colour, jar by jar
            </h2>
          </div>
          <p className="caption max-w-sm text-lg">
            Each jar holds the colour of one piece. Pick a jar and the wall keeps only its family.
          </p>
        </div>
        <ul className="mt-10 flex flex-wrap gap-x-5 gap-y-7" aria-label="Pieces by colour">
          {unique.map((product) => {
            const title = pieceTitle(product.title, product.categorySlug, product.attributes, product.id);
            const active = pigment === product.pigment;
            return (
              <li key={product.id}>
                <button
                  type="button"
                  className="jar"
                  aria-pressed={active}
                  aria-label={`${title}, colour ${product.pigment.toUpperCase()}${active ? ", filtering the wall" : ""}`}
                  onClick={() => choose(product.pigment)}
                >
                  <span className="jar-swatch" style={{ background: product.pigment }} aria-hidden="true" />
                  <span className="jar-name tag" aria-hidden="true">
                    {product.pigment.toUpperCase()}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {pigment ? (
          <button type="button" className="tag mt-4 inline-flex min-h-11 items-center text-ink underline" onClick={() => setPigment(null)}>
            Show every colour
          </button>
        ) : null}
      </div>
    </section>
  );
}
