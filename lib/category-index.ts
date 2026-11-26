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
 *
 * When `used` is given, automatic picks skip photographs already claimed by
 * an earlier row — the same print should never hang on two index rows — and
 * every chosen cover registers itself so later rows yield. A desk-chosen
 * cover is always honoured as the owner's intent, but still registers, so
 * automatic picks elsewhere step around it. Pieces are tried in given order,
 * available work before sold; a different piece is preferred over a second
 * photograph of a piece already hanging on the wall.
 */
export function coverForCategory(imageUrl: string | null, products: PublicProduct[], excludeId?: string, used?: Set<string>): PublicImage | null {
  if (imageUrl) {
    for (const product of products) {
      const match = product.images.find((image) => image.url === imageUrl);
      if (match) {
        used?.add(match.url);
        return match;
      }
    }
    if (isAllowedBlobUrl(imageUrl)) {
      used?.add(imageUrl);
      return { id: "", url: imageUrl, width: null, height: null, blurData: null, focalX: 0.5, focalY: 0.5, alt: "", sortOrder: 0 };
    }
  }
  const photographed = products.filter((product) => product.images.length > 0 && product.id !== excludeId);
  const availableFirst = [
    ...photographed.filter((product) => product.status !== "sold"),
    ...photographed.filter((product) => product.status === "sold"),
  ];
  if (!used) {
    return availableFirst[0]?.images[0] ?? null;
  }
  // First pass: a piece not yet hanging anywhere, by its lead photograph.
  for (const product of availableFirst) {
    const lead = product.images[0];
    if (!used.has(lead.url)) {
      used.add(lead.url);
      return lead;
    }
  }
  // Second pass: any photograph of any piece, so a row never repeats a print.
  for (const product of availableFirst) {
    const spare = product.images.find((image) => !used.has(image.url));
    if (spare) {
      used.add(spare.url);
      return spare;
    }
  }
  // Every photograph already hangs on another row: a text-only row is the
  // intentional design state and always beats showing the same print twice.
  return null;
}

/**
 * Rows for the material index, in desk order. Groups with no public pieces
 * are omitted; counts and covers never see drafts, hidden, or trashed work.
 * Rows are allocated covers in desk order through the shared `used` set, so
 * an earlier row's photograph is never repeated on a later one.
 */
export function buildIndex(categories: CategoryLike[], products: PublicProduct[], excludeId?: string, used?: Set<string>): IndexEntry[] {
  return categories
    .map((category) => {
      const pieces = orderForIndex(products.filter((product) => product.categoryId === category.id));
      return {
        id: category.id,
        slug: category.slug,
        name: category.name,
        intro: category.intro,
        count: pieces.length,
        cover: coverForCategory(category.imageUrl, pieces, excludeId, used),
      };
    })
    .filter((entry) => entry.count > 0);
}
