import { describe, expect, it } from "vitest";
import { displaySize } from "../lib/piece-title";
import { publicAttributes } from "../lib/public-attributes";
import { orderWallPieces, wallPriceKey } from "../lib/wall-order";
import type { PublicProduct } from "../lib/types";

describe("publicAttributes", () => {
  it("strips upload filenames and AI tidy-up metadata", () => {
    const clean = publicAttributes({
      size: "18 × 24 inches",
      medium: "Poured pigment on birch panel",
      details: "A quiet pour.",
      dimensions: "24 × 36 in",
      originalFile: "IMG_4092.HEIC",
      enhance: '{"img-1":{"status":"done","model":"gemini","cost":0.04}}',
      enhancedVersions: '{"img-1":"img-2"}',
    } as Record<string, string>);
    expect(clean).toEqual({
      size: "18 × 24 inches",
      medium: "Poured pigment on birch panel",
      details: "A quiet pour.",
      dimensions: "24 × 36 in",
    });
  });

  it("drops empty values and unknown keys by default", () => {
    const clean = publicAttributes({ size: "  ", provenance: "Private collection", medium: "oil" });
    expect(clean).toEqual({ medium: "oil" });
    expect("provenance" in clean).toBe(false);
  });
});

describe("displaySize", () => {
  it("size always wins over a stale dimensions fallback", () => {
    // The owner edits Size alone; an old dimensions value must not override it.
    expect(displaySize({ size: "20 × 24 inches", dimensions: "18 × 24 inches" })).toBe("20 × 24 inches");
  });

  it("falls back to dimensions for legacy records with no size", () => {
    expect(displaySize({ dimensions: "24 × 36 in (61 × 91 cm)" })).toBe("24 × 36 in (61 × 91 cm)");
  });

  it("is empty when neither is recorded", () => {
    expect(displaySize({})).toBe("");
    expect(displaySize(undefined)).toBe("");
  });
});

function piece(partial: Partial<PublicProduct>): PublicProduct {
  return {
    id: partial.id ?? "id",
    slug: partial.slug ?? "slug",
    title: partial.title ?? "A piece",
    description: "",
    priceMinor: partial.priceMinor ?? null,
    comparePriceMinor: null,
    currency: "USD",
    condition: "",
    quantity: null,
    sku: null,
    attributes: partial.attributes ?? {},
    tags: [],
    status: partial.status ?? "published",
    featured: false,
    showInStudio: false,
    categoryId: null,
    categoryName: null,
    categorySlug: "paintings",
    images: [],
    pigment: "#000000",
    pigmentInk: "#ffffff",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("orderWallPieces price sort", () => {
  const cheap = piece({ id: "cheap", priceMinor: 4000, title: "Cheap" });
  const pricey = piece({ id: "pricey", priceMinor: 6000, title: "Pricey" });
  const soldCheap = piece({ id: "sold", priceMinor: 5000, title: "Sold", status: "sold" });
  const askPrice = piece({ id: "ask", priceMinor: null, title: "Ask" });

  it("sold pieces never sort by their hidden asking price", () => {
    const ordered = orderWallPieces([pricey, soldCheap, cheap], "all", "price-asc");
    expect(ordered.map((p) => p.id)).toEqual(["cheap", "pricey", "sold"]);
  });

  it("unpriced and sold works both come after priced works", () => {
    const ordered = orderWallPieces([askPrice, soldCheap, cheap], "all", "price-asc");
    expect(ordered[0].id).toBe("cheap");
    expect(wallPriceKey(soldCheap)).toBe(Number.MAX_SAFE_INTEGER);
    expect(wallPriceKey(askPrice)).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("sold filter still isolates archive pieces", () => {
    const ordered = orderWallPieces([cheap, soldCheap], "sold", "price-asc");
    expect(ordered.map((p) => p.id)).toEqual(["sold"]);
  });
});
