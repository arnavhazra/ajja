import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import { pieceKind, pieceTitle } from "@/lib/piece-title";
import type { PublicProduct } from "@/lib/types";

type Props = {
  product: PublicProduct;
  priority?: boolean;
  sizes?: string;
  className?: string;
  index?: number;
};

export function PieceCard({ product, index, priority = false, sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw", className }: Props) {
  const cover = product.images[0];
  const title = pieceTitle(product.title, product.categorySlug, product.attributes);
  const kind = pieceKind(product.categoryName, product.attributes);
  const sold = product.status === "sold";
  const price = sold ? "Sold" : (formatMoney(product.priceMinor, product.currency) ?? "Ask for the price");
  const ratio = cover?.width && cover?.height ? `${cover.width} / ${cover.height}` : "4 / 5";
  return (
    <Link
      href={`/p/${product.slug}`}
      className={cn("piece-link group block", className)}
      style={{ "--pour": product.pigment, "--pour-ink": product.pigmentInk } as CSSProperties}
    >
      <div className="plate relative overflow-hidden" style={{ aspectRatio: ratio }}>
        {cover ? (
          <Image
            src={cover.url}
            alt={cover.alt || title}
            fill
            sizes={sizes}
            priority={priority}
            placeholder={cover.blurData ? "blur" : "empty"}
            blurDataURL={cover.blurData ?? undefined}
            className="object-cover"
            style={{ objectPosition: `${(cover.focalX ?? 0.5) * 100}% ${(cover.focalY ?? 0.5) * 100}%` }}
          />
        ) : null}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-pour shadow-[0_-2px_10px_var(--pour)] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100"
        />
      </div>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-[1.05rem] font-[560] leading-tight tracking-[-0.01em] transition-colors duration-200 group-hover:text-ink">{title}</p>
          <p className="caption mt-0.5 truncate">
            {index != null ? <span className="nums mr-2 not-italic">No. {String(index + 1).padStart(2, "0")}</span> : null}
            {kind}
          </p>
        </div>
        <p className={cn("nums shrink-0 text-[0.95rem] leading-tight", sold ? "text-sold" : "text-ink")}>
          <span aria-hidden="true" className="mr-2 inline-block size-2.5 translate-y-[-1px] rounded-full bg-pour align-middle shadow-[0_0_8px_var(--pour)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-125" />
          {price}
        </p>
      </div>
    </Link>
  );
}
