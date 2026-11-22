import type { PublicImage, PublicProduct } from "./types";

export type CategoryLike = {
  id: string;
  slug: string;
  name: string;
  intro: string;
  imageUrl: string | null;
};

export type IndexEntry = {
  id: string;
  slug: string;
  name: string;
  intro: string;
  count: number;
  cover: PublicImage | null;
};

/** The public piece order inside an art form: available first, sold last. */
export function orderForIndex<T extends { status: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => Number(a.status === "sold") - Number(b.status === "sold"));
}

/** A cover URL is only trusted when it lives on the shop's own Blob store. */
export function isAllowedBlobUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

/**
 * Cover precedence: the desk-chosen image first, then the first available
 * public piece photograph, then nothing — a text-only index row. A stored
 * cover URL is only honoured when it is an allowed Blob URL, so a pasted
 * external address can never load on the site.
 */
export function coverForCategory(imageUrl: string | null, products: PublicProduct[], excludeId?: string): PublicImage | null {
  if (imageUrl) {
    for (const product of products) {
      const match = product.images.find((image) => image.url === imageUrl);
      if (match) return match;
    }
    if (isAllowedBlobUrl(imageUrl)) {
      return { id: "", url: imageUrl, width: null, height: null, blurData: null, focalX: 0.5, focalY: 0.5, alt: "", sortOrder: 0 };
    }
  }
  const photographed = products.filter((product) => product.images.length > 0 && product.id !== excludeId);
  const lead = photographed.find((product) => product.status !== "sold") ?? photographed[0];
  return lead?.images[0] ?? null;
}

/**
 * Rows for the material index, in desk order. Groups with no public pieces
 * are omitted; counts and covers never see drafts, hidden, or trashed work.
 */
export function buildIndex(categories: CategoryLike[], products: PublicProduct[], excludeId?: string): IndexEntry[] {
  return categories
    .map((category) => {
      const pieces = orderForIndex(products.filter((product) => product.categoryId === category.id));
      return {
        id: category.id,
        slug: category.slug,
        name: category.name,
        intro: category.intro,
        count: pieces.length,
        cover: coverForCategory(category.imageUrl, pieces, excludeId),
      };
    })
    .filter((entry) => entry.count > 0);
}
