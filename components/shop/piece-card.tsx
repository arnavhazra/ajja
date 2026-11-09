"use client";

import Image from "next/image";
import Link from "next/link";
import { ViewTransition, type CSSProperties, type MouseEvent } from "react";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import { hasRealTitle, pieceKind, pieceRef, pieceTitle } from "@/lib/piece-title";
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
  sizes = "(min-width: 1180px) 22vw, (min-width: 900px) 30vw, (min-width: 560px) 46vw, 94vw",
  className,
  index = 0,
}: Props) {
  const { format } = useCurrency();
  const { hasItem, toggleItem, setIsOpen: setFolioOpen } = useFolio();
  const { openDossier } = useDossier();

  const cover = product.images[0];
  const named = hasRealTitle(product.title);
  const title = named ? product.title.trim() : `no. ${pieceRef(product.id)}`;
  const fullTitle = pieceTitle(product.title, product.categorySlug, product.attributes, product.id);
  const kind = pieceKind(product.categoryName, product.attributes);
  const sold = product.status === "sold";
  const inFolio = hasItem(product.id);

  const dynamicPrice = format(product.priceMinor);
  const price = sold ? "sold" : (dynamicPrice ?? formatMoney(product.priceMinor, product.currency) ?? "price on asking");
  const ratio = cover?.width && cover?.height ? `${cover.width} / ${cover.height}` : "4 / 5";
  const ratioValue = cover?.width && cover?.height ? cover.width / cover.height : 0.8;

  const handleFolioClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem({
      id: product.id,
      slug: product.slug,
      title: fullTitle,
      priceMinor: product.priceMinor,
      imageUrl: cover?.url,
      kind: kind ?? undefined,
      dimensions: product.attributes.dimensions || product.attributes.size || "",
    });
    if (!inFolio) setFolioOpen(true);
  };

  const handleDossierClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openDossier(product);
  };

  return (
    <figure
      className={cn("piece", className)}
      style={
        {
          "--pig": product.pigment,
          "--pig-ink": product.pigmentInk,
          "--r": ratioValue,
          "--reveal-delay": `${(index % 4) * 60}ms`,
        } as CSSProperties
      }
      data-reveal=""
      data-flip-id={product.id}
      data-sold={sold ? "" : undefined}
    >
      <ViewTransition name={`piece-${product.id}`}>
        <Link href={`/p/${product.slug}`} className="ph" style={{ aspectRatio: ratio }} aria-label={fullTitle}>
          {cover ? (
            <Image
              src={cover.url}
              alt={cover.alt || fullTitle}
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
      <figcaption>
        <ViewTransition name={`piece-label-${product.id}`}>
          <span className="cap">
            <span className="tick" aria-hidden="true" />
            <Link href={`/p/${product.slug}`} className="cap-line inline-flex min-h-11 min-w-0 flex-1 items-center">
              <span className="truncate">
                {title}
                {kind ? ` — ${kind}` : ""}
              </span>
            </Link>
            <span className="cap-price">{price}</span>
          </span>
        </ViewTransition>
        <div className="cap-acts">
          {!sold ? (
            <button
              type="button"
              onClick={handleFolioClick}
              className={cn("cap-act", inFolio && "saved")}
              aria-label={inFolio ? `Remove ${fullTitle} from saved` : `Save ${fullTitle}`}
            >
              {inFolio ? "saved" : "save"}
            </button>
          ) : null}
          <button type="button" onClick={handleDossierClick} className="cap-act" aria-label={`Quick look at ${fullTitle}`}>
            quick look
          </button>
        </div>
      </figcaption>
    </figure>
  );
}
