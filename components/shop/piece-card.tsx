import Image from "next/image";
import Link from "next/link";
import { ViewTransition, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import { displaySize, pieceKind, pieceRef, pieceTitle } from "@/lib/piece-title";
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
  sizes = "(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 94vw",
  className,
  index = 0,
}: Props) {
  const cover = product.images[0];
  const fullTitle = pieceTitle(product.title, product.categorySlug, product.attributes, product.id);
  const kind = pieceKind(product.categoryName, product.attributes);
  const sold = product.status === "sold";
  const dimensions = displaySize(product.attributes);
  const refCode = (product.sku || pieceRef(product.id)).toUpperCase();
  const price = sold ? "Private archive" : (formatMoney(product.priceMinor, product.currency) ?? "Price on inquiry");

  return (
    <article
      className={cn("group flex flex-col", className)}
      style={
        {
          "--pig": product.pigment,
          "--pig-ink": product.pigmentInk,
          "--reveal-delay": `${(index % 4) * 60}ms`,
        } as CSSProperties
      }
      data-reveal=""
      data-flip-id={product.id}
      data-sold={sold ? "" : undefined}
    >
      <ViewTransition name={`piece-${product.id}`}>
        <Link
          href={`/p/${product.slug}`}
          className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[2px] border border-line bg-wall-deep p-4 transition-colors duration-200 group-hover:border-line-strong"
          aria-label={fullTitle}
        >
          {cover ? (
            <Image
              src={cover.url}
              alt={cover.alt || fullTitle}
              fill
              sizes={sizes}
              priority={priority}
              placeholder={cover.blurData ? "blur" : "empty"}
              blurDataURL={cover.blurData ?? undefined}
              className="object-contain p-4 transition-transform duration-300 group-hover:scale-[1.015]"
            />
          ) : null}
          <span
            aria-hidden="true"
            className="micro-label pointer-events-none absolute left-3 top-2.5 text-[0.68rem] text-tar/60"
          >
            REF. {refCode}
          </span>
        </Link>
      </ViewTransition>

      <div className="flex items-center justify-between gap-2 border-b border-line pt-2.5 pb-1">
        <ViewTransition name={`piece-label-${product.id}`}>
          <Link
            href={`/p/${product.slug}`}
            className="inline-flex min-h-11 min-w-0 flex-1 items-center gap-2 text-tar transition-colors hover:text-sap"
          >
            <span className="ledger shrink-0 text-sap" aria-hidden="true">
              §
            </span>
            <span className="type truncate text-base font-medium">{fullTitle}</span>
          </Link>
        </ViewTransition>
        {!sold ? (
          <PieceSaveButton
            id={product.id}
            slug={product.slug}
            title={fullTitle}
            priceMinor={product.priceMinor}
            imageUrl={cover?.url}
            kind={kind ?? undefined}
            dimensions={dimensions}
          />
        ) : null}
      </div>

      <div className="ledger flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-tar-soft">
        <div className="flex flex-wrap items-center gap-2">
          {dimensions ? (
            <>
              <span>{dimensions}</span>
              <span aria-hidden="true">·</span>
            </>
          ) : kind ? (
            <>
              <span>{kind}</span>
              <span aria-hidden="true">·</span>
            </>
          ) : null}
          <span className={cn("inline-flex items-center gap-1.5 font-bold uppercase tracking-wider", sold ? "text-sold" : "text-ok")}>
            <span className={cn("size-1.5 rounded-full", sold ? "bg-sold" : "bg-ok")} aria-hidden="true" />
            {sold ? "Held in archive" : "Available direct"}
          </span>
        </div>
        <span className={cn("nums font-bold tracking-tight", sold ? "text-tar-soft" : "text-tar")}>{price}</span>
      </div>
    </article>
  );
}
