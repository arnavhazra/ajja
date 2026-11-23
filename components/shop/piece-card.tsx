import Image from "next/image";
import Link from "next/link";
import { ViewTransition, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import { pieceKind, pieceTitle } from "@/lib/piece-title";
import type { PublicProduct } from "@/lib/types";
import { PieceSaveButton } from "./piece-save-button";

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
  const cover = product.images[0];
  const fullTitle = pieceTitle(product.title, product.categorySlug, product.attributes, product.id);
  const kind = pieceKind(product.categoryName, product.attributes);
  const sold = product.status === "sold";

  const price = sold ? "sold" : (formatMoney(product.priceMinor, product.currency) ?? "Ask for the price");
  const ratio = cover?.width && cover?.height ? `${cover.width} / ${cover.height}` : "4 / 5";
  const ratioValue = cover?.width && cover?.height ? cover.width / cover.height : 0.8;

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
              className="object-contain"
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
                {fullTitle}
                {kind ? ` — ${kind}` : ""}
              </span>
            </Link>
            <span className="cap-price">{price}</span>
          </span>
        </ViewTransition>
        <div className="cap-acts">
          {!sold ? (
            <PieceSaveButton
              id={product.id}
              slug={product.slug}
              title={fullTitle}
              priceMinor={product.priceMinor}
              imageUrl={cover?.url}
              kind={kind ?? undefined}
              dimensions={product.attributes.dimensions || product.attributes.size || ""}
            />
          ) : null}

        </div>
      </figcaption>
    </figure>
  );
}
