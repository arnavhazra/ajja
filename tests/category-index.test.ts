import { describe, expect, it } from "vitest";
import { buildIndex, coverForCategory, orderForIndex } from "@/lib/category-index";
import type { PublicImage, PublicProduct } from "@/lib/types";

const img = (url: string): PublicImage => ({
  id: url,
  url,
  width: 100,
  height: 100,
  blurData: null,
  focalX: 0.5,
  focalY: 0.5,
  alt: "",
  sortOrder: 0,
});

const piece = (over: Partial<PublicProduct>): PublicProduct => ({
  id: over.id ?? "p1",
  slug: "s",
  title: "",
  description: "",
  priceMinor: null,
  comparePriceMinor: null,
  currency: "USD",
  condition: "",
  quantity: null,
  sku: null,
  attributes: {},
  tags: [],
  status: "published",
  featured: false,
  showInStudio: true,
  categoryId: "c1",
  categoryName: null,
  categorySlug: null,
  images: [],
  pigment: "#000000",
  pigmentInk: "#ffffff",
  createdAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

describe("material index", () => {
  it("orders available pieces before sold ones", () => {
    const ordered = orderForIndex([
      piece({ id: "sold1", status: "sold" }),
      piece({ id: "open1", status: "published" }),
      piece({ id: "sold2", status: "sold" }),
      piece({ id: "open2", status: "scheduled" }),
    ]);
    expect(ordered.map((item) => item.id)).toEqual(["open1", "open2", "sold1", "sold2"]);
  });

  it("prefers the desk-chosen cover, then the first available public photo, then text-only", () => {
    const photo = img("https://blob.example/chosen.webp");
    const other = img("https://blob.example/other.webp");
    const products = [
      piece({ id: "a", status: "sold", images: [other] }),
      piece({ id: "b", status: "published", images: [photo] }),
    ];
    // Explicit image keeps its focal/blur data when it matches a public photo.
    expect(coverForCategory(photo.url, products)?.url).toBe(photo.url);
    // No explicit image: the first *available* piece lends its photo.
    expect(coverForCategory(null, products)?.url).toBe(photo.url);
    // Only sold pieces photographed: still a real photo, never invented.
    expect(coverForCategory(null, [products[0]])?.url).toBe(other.url);
    // No photos at all: text-only row.
    expect(coverForCategory(null, [piece({ id: "c" })])).toBeNull();
    expect(coverForCategory(null, [])).toBeNull();
  });

  it("never hangs the same photograph on two rows of the index", () => {
    const first = img("https://blob.example/first.webp");
    const second = img("https://blob.example/second.webp");
    const third = img("https://blob.example/third.webp");
    const products = [
      piece({ id: "a", categoryId: "c1", images: [first] }),
      piece({ id: "b", categoryId: "c2", images: [second] }),
      piece({ id: "c", categoryId: "c1", images: [third] }),
    ];
    const categories = [
      { id: "c1", slug: "paintings", name: "Paintings", intro: "", imageUrl: null },
      { id: "c2", slug: "woodwork", name: "Woodwork", intro: "", imageUrl: null },
    ];
    const used = new Set<string>();
    const entries = buildIndex(categories, products, undefined, used);
    expect(entries[0].cover?.url).toBe(first.url);
    expect(entries[1].cover?.url).toBe(second.url);
    // The trailing "All pieces" row yields to every category row.
    const all = coverForCategory(null, products, undefined, used);
    expect(all?.url).toBe(third.url);
    const urls = [entries[0].cover?.url, entries[1].cover?.url, all?.url];
    expect(new Set(urls).size).toBe(3);
  });

  it("falls back to a text-only row rather than repeating a photograph", () => {
    const only = img("https://blob.example/only.webp");
    const products = [piece({ id: "a", categoryId: "c1", images: [only] })];
    const used = new Set<string>([only.url]);
    expect(coverForCategory(null, products, undefined, used)).toBeNull();
  });

  it("honours a desk-chosen cover and registers it so later automatic picks step around it", () => {
    const chosen = img("https://blob.example/chosen-cover.webp");
    const other = img("https://blob.example/other-piece.webp");
    const products = [
      piece({ id: "a", categoryId: "c1", images: [chosen] }),
      piece({ id: "b", categoryId: "c1", images: [other] }),
    ];
    const used = new Set<string>();
    // The owner's explicit choice wins even though another piece leads.
    expect(coverForCategory(chosen.url, products, undefined, used)?.url).toBe(chosen.url);
    expect(used.has(chosen.url)).toBe(true);
    // An automatic pick sharing the wall then steps around the chosen print.
    expect(coverForCategory(null, products, undefined, used)?.url).toBe(other.url);
  });

  it("prefers a different piece over a second photograph of a piece already hanging", () => {
    const lead = img("https://blob.example/lead.webp");
    const detail = img("https://blob.example/detail.webp");
    const fresh = img("https://blob.example/fresh.webp");
    const products = [
      piece({ id: "a", images: [lead, detail] }),
      piece({ id: "b", images: [fresh] }),
    ];
    const used = new Set<string>([lead.url]);
    expect(coverForCategory(null, products, undefined, used)?.url).toBe(fresh.url);
    // With every other lead claimed too, a spare photograph still beats a repeat.
    const allUsed = new Set<string>([lead.url, fresh.url]);
    expect(coverForCategory(null, products, undefined, allUsed)?.url).toBe(detail.url);
  });

  it("omits empty groups and counts only the pieces passed in", () => {
    const categories = [
      { id: "c1", slug: "paintings", name: "Paintings", intro: "", imageUrl: null },
      { id: "c2", slug: "woodwork", name: "Woodwork", intro: "", imageUrl: null },
      { id: "c3", slug: "empty", name: "Empty", intro: "", imageUrl: null },
    ];
    const entries = buildIndex(categories, [piece({ id: "x", categoryId: "c1" }), piece({ id: "y", categoryId: "c2", status: "sold" })]);
    expect(entries.map((entry) => entry.slug)).toEqual(["paintings", "woodwork"]);
    expect(entries.map((entry) => entry.count)).toEqual([1, 1]);
  });
});
