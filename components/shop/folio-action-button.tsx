"use client";

import { useFolio } from "./collectors-folio";
import { cn } from "@/lib/cn";
import type { PublicProduct } from "@/lib/types";

export function FolioActionButton({
  product,
  title,
  kind,
  className,
}: {
  product: PublicProduct;
  title: string;
  kind?: string;
  className?: string;
}) {
  const { hasItem, toggleItem, setIsOpen } = useFolio();
  const inFolio = hasItem(product.id);
  const cover = product.images[0];

  const handleClick = () => {
    toggleItem({
      id: product.id,
      slug: product.slug,
      title,
      priceMinor: product.priceMinor,
      imageUrl: cover?.url,
      kind,
      dimensions: product.attributes.size || product.attributes.dimensions,
      stripeUrl: product.attributes.stripe_url || product.attributes.stripe_payment_link,
    });
    if (!inFolio) {
      setIsOpen(true);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "btn min-h-11 transition-all cursor-pointer",
        inFolio
          ? "border-pour bg-pour text-pour-ink font-semibold"
          : "btn-secondary",
        className,
      )}
      aria-label={inFolio ? `Remove ${title} from folio` : `Add ${title} to folio`}
    >
      {inFolio ? "✓ In Collector's Folio" : "+ Add to Folio"}
    </button>
  );
}

