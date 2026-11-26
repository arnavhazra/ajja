import { pieceTitle } from "./piece-title";
import type { PublicProduct } from "./types";

export type WallFilter = "all" | "available" | "sold";
export type WallSort = "catalogue" | "title" | "price-asc";

/**
 * Price sort key for the public wall. A sold piece keeps its old asking price
 * in the catalogue but shows no price on its card, so it must sort as unpriced —
 * after every visibly priced work — never interleaved by its hidden number.
 */
export function wallPriceKey(piece: Pick<PublicProduct, "status" | "priceMinor">): number {
  if (piece.status === "sold") return Number.MAX_SAFE_INTEGER;
  return piece.priceMinor ?? Number.MAX_SAFE_INTEGER;
}

/** Filter and order the public wall. Catalogue order is the desk's own order. */
export function orderWallPieces(
  pieces: PublicProduct[],
  filter: WallFilter,
  sort: WallSort,
): PublicProduct[] {
  const filtered =
    filter === "available"
      ? pieces.filter((p) => p.status !== "sold")
      : filter === "sold"
        ? pieces.filter((p) => p.status === "sold")
        : pieces;

  if (sort === "catalogue") return filtered;
  const copy = [...filtered];
  if (sort === "title") {
    copy.sort((a, b) =>
      pieceTitle(a.title, a.categorySlug, a.attributes, a.id).localeCompare(
        pieceTitle(b.title, b.categorySlug, b.attributes, b.id),
      ),
    );
  } else if (sort === "price-asc") {
    copy.sort((a, b) => wallPriceKey(a) - wallPriceKey(b));
  }
  return copy;
}
