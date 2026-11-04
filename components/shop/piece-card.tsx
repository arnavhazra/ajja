"use client";

import Image from "next/image";
import Link from "next/link";
import type { MouseEvent } from "react";
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
  const title = pieceTitle(product.title, product.categorySlug, product.attributes);
  const kind = pieceKind(product.categoryName, product.attributes) || "Studio Artifact";
  const dimensions = product.attributes.dimensions || product.attributes.size || "Dimensions on request";
  const sold = product.status === "sold";
  const inFolio = hasItem(product.id);

  const dynamicPrice = format(product.priceMinor);
  const price = sold ? "Reserved" : (dynamicPrice ?? (formatMoney(product.priceMinor, product.currency) ?? "Ask for price"));
  const ratio = cover?.width && cover?.height ? `${cover.width} / ${cover.height}` : "4 / 5";
  const specimenCode = product.slug.toUpperCase();

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
      stripeUrl: product.attributes.stripe_url || product.attributes.stripe_payment_link,
    });
    if (!inFolio) setFolioOpen(true);
  };

  const handleDossierClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openDossier(product);
  };

  return (
    <article className={cn("group flex flex-col bg-bone hairline-box rounded-sm p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1", className)}>
      {/* Specimen Header Strip */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 hairline-b font-mono text-[10px] tracking-widest uppercase">
        <span className="font-semibold text-ink">SPECIMEN // {specimenCode}</span>
        <span className={cn("px-1.5 py-0.5 rounded-sm font-bold", sold ? "bg-sold/15 text-sold" : "bg-moss/15 text-moss")}>
          {sold ? "RESERVED" : "1 OF 1"}
        </span>
      </div>

      {/* Artwork Photograph Container */}
      <div
        className="relative w-full overflow-hidden rounded-sm bg-boneDark cursor-pointer select-none hairline-box group"
        style={{ aspectRatio: ratio }}
        onClick={handleDossierClick}
      >
        {cover ? (
          <Image
            src={cover.url}
            alt={cover.alt || title}
            fill
            sizes={sizes}
            priority={priority}
            placeholder={cover.blurData ? "blur" : "empty"}
            blurDataURL={cover.blurData ?? undefined}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            style={{ objectPosition: `${(cover.focalX ?? 0.5) * 100}% ${(cover.focalY ?? 0.5) * 100}%` }}
          />
        ) : null}

        {/* Quick Loupe Examine Overlay hint */}
        <div className="absolute inset-0 bg-ink/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="bg-linen/95 px-3 py-1.5 rounded-sm font-mono text-[10px] uppercase tracking-widest text-ink shadow-md hairline-box">
            [Examine Dossier]
          </span>
        </div>
      </div>

      {/* Specimen Metadata & Title */}
      <div className="pt-3.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <Link
              href={`/p/${product.slug}`}
              className="font-serif text-xl sm:text-2xl font-medium text-ink hover:text-terracotta transition-colors leading-snug line-clamp-2"
            >
              {title}
            </Link>
            <span className={cn("font-mono text-xs sm:text-sm font-bold shrink-0", sold ? "text-sold" : "text-ink")}>
              {price}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-umber pt-1">
            <span className="truncate">{kind}</span>
            <span>•</span>
            <span className="truncate">{dimensions}</span>
          </div>
        </div>

        {/* Specimen Action Strip */}
        <div className="pt-4 mt-3 hairline-t flex items-center gap-2">
          <button
            type="button"
            onClick={handleDossierClick}
            className="flex-1 py-2 px-3 bg-linen hover:bg-boneDark text-ink font-mono text-[11px] uppercase tracking-wider hairline-box rounded-sm transition-colors text-center cursor-pointer"
          >
            Examine Dossier
          </button>

          {!sold ? (
            <button
              type="button"
              onClick={handleFolioClick}
              className={cn(
                "py-2 px-3 font-mono text-[11px] uppercase tracking-wider rounded-sm transition-colors cursor-pointer",
                inFolio
                  ? "bg-moss text-linen"
                  : "bg-terracotta hover:bg-terracottaDark text-linen",
              )}
              aria-label={inFolio ? `Remove ${title} from folio` : `Add ${title} to folio`}
            >
              {inFolio ? "✓ Reserved" : "+ Reserve"}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
