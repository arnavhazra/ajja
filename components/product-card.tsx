import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { SaveButton } from "./save-button";
import type { PublicProduct } from "@/lib/types";

export function pieceTitle(
  title?: string | null,
  categoryOrHint?: string | null,
  attributes?: Record<string, string>
) {
  const trimmed = title?.trim();
  if (trimmed && !/^title not written yet$/i.test(trimmed) && !/^studio study/i.test(trimmed)) {
    return trimmed;
  }
  const medium = attributes?.medium?.toLowerCase() ?? "";
  const cat = (categoryOrHint ?? "").toLowerCase();
  if (cat.includes("paint") || medium.includes("paint") || medium.includes("canvas")) {
    return "Poured Painting";
  }
  if (cat.includes("wood") || medium.includes("wood") || medium.includes("pine")) {
    return "Handcrafted Woodwork";
  }
  return "Studio Piece";
}

export function ProductCard({
  product,
  href,
}: {
  product: PublicProduct;
  href?: string;
}) {
  const targetHref = href || `/p/${product.slug}`;
  const image = product.images[0];
  const price = product.priceMinor != null ? formatMoney(product.priceMinor, product.currency) : null;
  const title = pieceTitle(product.title, product.categorySlug, product.attributes);
  const categoryLabel = product.categoryName || (product.attributes?.medium?.includes("wood") ? "Woodwork" : "Paintings");

  // Determine native aspect ratio class based on image dimensions
  const aspectClass =
    image && image.width && image.height
      ? image.height / image.width > 1.8
        ? "aspect-[1/2]"
        : image.height > image.width
          ? "aspect-[4/5]"
          : image.width > image.height
            ? "aspect-[4/3]"
            : "aspect-square"
      : "aspect-[4/5]";

  return (
    <article className="art-card group bg-bone hairline-box rounded-sm p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_16px_36px_rgba(30,27,24,0.08)]">
      <div>
        <Link href={targetHref} className="block">
          <div className={`art-card-img-wrap ${aspectClass} w-full rounded-sm mb-3.5 archival-vignette relative overflow-hidden bg-bone-dark`}>
            {image ? (
              <Image
                src={image.url}
                alt={image.alt || `${title} in the Collegeville studio.`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="art-card-img object-cover"
                style={{ objectPosition: `${image.focalX * 100}% ${image.focalY * 100}%` }}
                placeholder={image.blurData ? "blur" : "empty"}
                blurDataURL={image.blurData ?? undefined}
              />
            ) : (
              <div className="grid h-full place-items-center p-4 text-center text-umber font-mono text-xs uppercase">
                {title}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pb-2 mb-2 hairline-b font-mono text-[10px] tracking-widest uppercase">
            <span className="text-ink font-bold">{categoryLabel}</span>
            <span className={product.status === "sold" ? "text-umber font-bold" : "text-terracotta font-bold"}>
              {product.status === "sold" ? "ACQUIRED" : "1 OF 1"}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <h3 className="font-serif text-xl sm:text-2xl text-ink font-medium leading-snug group-hover:text-terracotta transition-colors">
              {title}
            </h3>
            <span className="font-mono text-xs text-ink font-bold whitespace-nowrap">
              {product.status === "sold" ? "Acquired" : (price ?? "Ask about this piece")}
            </span>
          </div>

          {product.description ? (
            <p className="text-xs text-umber line-clamp-2 leading-relaxed mb-4">
              {product.description}
            </p>
          ) : null}
        </Link>
      </div>

      <div className="pt-3 hairline-t flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-wider">
        <Link
          href={targetHref}
          className="py-1.5 px-3 rounded-sm bg-linen hover:bg-ink hover:text-linen text-ink hairline-box transition-colors text-center"
        >
          [Inspect Piece]
        </Link>

        <SaveButton slug={product.slug} className="py-1.5 px-3 rounded-sm hairline-box bg-linen hover:bg-bone-dark" />
      </div>
    </article>
  );
}
