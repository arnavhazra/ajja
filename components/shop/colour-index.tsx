import Link from "next/link";
import { pieceTitle } from "@/lib/piece-title";
import type { PublicProduct } from "@/lib/types";

/** One band of colour per piece, sampled from its photograph. */
export function ColourIndex({ products }: { products: PublicProduct[] }) {
  if (products.length < 3) return null;
  const run = [...products, ...products];
  return (
    <section aria-labelledby="colour-title" className="overflow-hidden py-16 md:py-24">
      <div className="shell flex flex-wrap items-end justify-between gap-4">
        <h2 id="colour-title" className="display-wide text-2xl md:text-3xl">
          An index of colour
        </h2>
        <p className="caption max-w-sm">Each band is taken from one photograph. Choose a colour to see its piece.</p>
      </div>
      <div className="mt-8">
        <ul className="swatch-run" aria-label="Pieces by colour">
          {run.map((product, index) => {
            const title = pieceTitle(product.title, product.categorySlug, product.attributes);
            const duplicate = index >= products.length;
            return (
              <li key={`${product.id}-${index}`} aria-hidden={duplicate || undefined}>
                <Link
                  href={`/p/${product.slug}`}
                  tabIndex={duplicate ? -1 : undefined}
                  className="group relative flex h-40 w-24 flex-col justify-end overflow-hidden p-3 transition-[width,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:w-56 focus-visible:w-56 active:scale-[0.98] md:h-56 md:w-28"
                  style={{ background: product.pigment, color: product.pigmentInk }}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <span className="relative z-10 truncate text-sm font-[560] tracking-tight opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                    {title}
                  </span>
                  <span className="nums relative z-10 text-xs opacity-0 transition-opacity duration-300 group-hover:opacity-85 group-focus-visible:opacity-85">
                    {product.pigment.toUpperCase()}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
