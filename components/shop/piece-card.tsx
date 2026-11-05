"use client";

import Image from "next/image";
import Link from "next/link";
import { ViewTransition, type MouseEvent } from "react";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import { pieceKind, pieceTitle } from "@/lib/piece-title";
import type { PublicProduct } from "@/lib/types";
import { useCurrency } from "./currency-provider";
import { useFolio } from "./collectors-folio";
import { useDossier } from "./dossier-modal";

type Props = {
  product: PublicProduct;
  priority?: boolean;
  sizes?: string;
  className?: string;
  index?: number;
};

function surfaceClass(kind: string) {
  const hint = kind.toLowerCase();
  if (hint.includes("ceramic") || hint.includes("glaze") || hint.includes("pot")) return "surface-glaze";
  if (hint.includes("wood") || hint.includes("pine") || hint.includes("walnut")) return "surface-wood";
  return "surface-canvas";
}

export function PieceCard({
  product,
  priority = false,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  className,
}: Props) {
  const { format } = useCurrency();
  const { hasItem, toggleItem, setIsOpen: setFolioOpen } = useFolio();
  const { openDossier } = useDossier();

  const cover = product.images[0];
  const title = pieceTitle(product.title, product.categorySlug, product.attributes, product.id);
  const kind = pieceKind(product.categoryName, product.attributes) || "Studio piece";
  const dimensions = product.attributes.dimensions || product.attributes.size || "";
  const sold = product.status === "sold";
  const inFolio = hasItem(product.id);

  const dynamicPrice = format(product.priceMinor);
  const price = sold ? "Sold" : (dynamicPrice ?? (formatMoney(product.priceMinor, product.currency) ?? "Ask for price"));
  const ratio = cover?.width && cover?.height ? `${cover.width} / ${cover.height}` : "4 / 5";

  const handleFolioClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem({
      id: product.id,
      slug: product.slug,
      title,
      priceMinor: product.priceMinor,
      imageUrl: cover?.url,
      kind: kind ?? undefined,
      dimensions,
    });
    if (!inFolio) setFolioOpen(true);
  };

  const handleDossierClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openDossier(product);
  };

  return (
    <article className={cn("group relative flex flex-col", className)}>
      {/* Photograph with the kind's surface texture; lifts on hover */}
      <ViewTransition name={`piece-${product.id}`}>
        <Link
          href={`/p/${product.slug}`}
          tabIndex={-1}
          aria-hidden="true"
          className={cn(
            "relative block w-full overflow-hidden rounded-[2px] bg-plate select-none hairline-box",
            "transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-1.5 group-hover:shadow-[0_18px_40px_-16px_rgba(15,18,22,0.4)]",
            surfaceClass(kind),
          )}
          style={{ aspectRatio: ratio }}
        >
          {cover ? (
            <Image
              src={cover.url}
              alt=""
              fill
              sizes={sizes}
              priority={priority}
              placeholder={cover.blurData ? "blur" : "empty"}
              blurDataURL={cover.blurData ?? undefined}
              className="object-cover"
              style={{ objectPosition: `${(cover.focalX ?? 0.5) * 100}% ${(cover.focalY ?? 0.5) * 100}%` }}
            />
          ) : null}
        </Link>
      </ViewTransition>

      {/* Wall label — the paper tag that morphs onto the piece page */}
      <ViewTransition name={`piece-label-${product.id}`}>
        <div className="wall-label relative z-10 -mt-6 mx-3 grid gap-1.5 p-3.5 transition-colors duration-500 group-hover:bg-pour group-hover:[--ink:var(--pour-ink)]">
          <Link
            href={`/p/${product.slug}`}
            className="display-wide block text-lg leading-snug text-ink line-clamp-2 transition-colors group-hover:text-pour-ink"
          >
            {title}
          </Link>
          <span className="tag block truncate">{kind}{dimensions ? ` · ${dimensions}` : ""}</span>
          <span className={cn("nums block text-sm font-bold", sold ? "text-sold" : "text-ink")}>{price}</span>
          <div className="flex items-center justify-end gap-1 border-t border-line pt-1.5">
              <button
                type="button"
                onClick={handleDossierClick}
                className="tag inline-flex min-h-11 items-center px-2 text-ink-soft transition-colors hover:text-ink cursor-pointer"
              >
                Quick look
              </button>
              {!sold ? (
                <button
                  type="button"
                  onClick={handleFolioClick}
                  className={cn(
                    "tag inline-flex min-h-11 items-center px-2 transition-colors cursor-pointer",
                    inFolio ? "text-ok" : "text-pour hover:text-ink",
                  )}
                  aria-label={inFolio ? `Remove ${title} from saved` : `Save ${title}`}
                >
                  {inFolio ? "✓ Saved" : "Save"}
                </button>
              ) : null}
          </div>
        </div>
      </ViewTransition>
    </article>
  );
}
