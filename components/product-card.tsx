import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import type { PublicProduct } from "@/lib/types";

export function pieceTitle(title?: string | null, slugOrHint?: string) {
  const trimmed = title?.trim();
  if (trimmed && !/^title not written yet$/i.test(trimmed)) return trimmed;
  if (slugOrHint) {
    const match = slugOrHint.match(/(?:piece|study)[-_]?([a-zA-Z0-9]+)/i);
    if (match?.[1]) {
      const id = match[1];
      if (/^\d+$/.test(id)) {
        return `Studio Study No. ${id}`;
      }
      return `Studio Study ${id.slice(0, 4).toUpperCase()}`;
    }
  }
  return "Studio Study";
}

export function ProductCard({ product, href }: { product: PublicProduct; href?: string }) {
  const image = product.images[0];
  const listed = product.status === "published" || product.status === "sold" || product.status === "scheduled";
  const price = listed ? formatMoney(product.priceMinor, product.currency) : null;
  const compare =
    price && product.comparePriceMinor && product.priceMinor != null && product.comparePriceMinor > product.priceMinor
      ? formatMoney(product.comparePriceMinor, product.currency)
      : null;
  const destination = href ?? (listed ? `/p/${product.slug}` : `/studio/${product.slug}`);
  const title = pieceTitle(product.title, product.slug);
  return (
    <article>
      <Link href={destination} className="photo-link">
        <div className="photo-frame crop relative" style={{ position: "relative" }}>
          {image ? (
            <Image
              src={image.url}
              alt={image.alt || `${title} in the studio.`}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
              style={{ objectPosition: `${image.focalX * 100}% ${image.focalY * 100}%` }}
              placeholder={image.blurData ? "blur" : "empty"}
              blurDataURL={image.blurData ?? undefined}
            />
          ) : (
            <div className="grid h-full place-items-center p-4 text-center text-ink-soft">Studio Study</div>
          )}
        </div>
        <h2 className="mt-3 font-display text-xl text-ink">{title}</h2>
        {product.categoryName ? <p className="text-ink-soft">{product.categoryName}</p> : null}
      </Link>
      <p className="nums mt-1">
        {product.status === "sold" ? <span className="text-sold">Sold. </span> : null}
        {compare ? <s className="mr-2 text-ink-soft">{compare}</s> : null}
        <span>{price ?? (listed ? "Inquire for price" : "Studio Collection · Inquire")}</span>
      </p>
      {product.quantity === 1 && product.status === "published" ? <p className="text-ink-soft">Only 1 available</p> : null}
    </article>
  );
}
