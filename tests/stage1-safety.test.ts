import { describe, expect, it } from "vitest";
import { coverForCategory, isAllowedBlobUrl } from "../lib/category-index";
import { jsonLdSource } from "../components/json-ld";
import { slugRedirectPlan } from "../lib/slug-redirects";
import type { PublicProduct } from "../lib/types";

const blobBase = "https://store.public.blob.vercel-storage.com";

function image(url: string) {
  return { id: "img-1", url, width: 800, height: 600, blurData: null, focalX: 0.5, focalY: 0.5, alt: "A piece", sortOrder: 0 };
}

function product(url: string, status = "published"): PublicProduct {
  return {
    id: "prod-1",
    slug: "a-piece",
    title: "A piece",
    status,
    categoryId: "cat-1",
    priceMinor: null,
    images: [image(url)],
  } as PublicProduct;
}

describe("coverForCategory", () => {
  it("never loads a pasted external URL", () => {
    const cover = coverForCategory("https://evil.example.com/x.png", [product(`${blobBase}/good.jpg`)]);
    expect(cover?.url).toBe(`${blobBase}/good.jpg`);
  });

  it("returns no cover when the only URL is external and no photos exist", () => {
    expect(coverForCategory("https://evil.example.com/x.png", [])).toBeNull();
  });

  it("accepts a stored Blob URL as cover", () => {
    const url = `${blobBase}/cover.jpg`;
    expect(coverForCategory(url, [])?.url).toBe(url);
  });

  it("isAllowedBlobUrl rejects non-Blob hosts", () => {
    expect(isAllowedBlobUrl("https://evil.example.com/x.png")).toBe(false);
    expect(isAllowedBlobUrl(`${blobBase}/x.png`)).toBe(true);
    expect(isAllowedBlobUrl("not a url")).toBe(false);
  });
});

describe("jsonLdSource", () => {
  it("escapes < so a </script> can never break out", () => {
    const source = jsonLdSource({ name: "x", description: "</script><script>alert(1)</script>" });
    expect(source).not.toContain("</script>");
    expect(source).toContain("\\u003c/script>");
  });
});

describe("slugRedirectPlan", () => {
  it("writes /p/ and /studio/ redirects for a slug move", () => {
    const plan = slugRedirectPlan("old-slug", "new-slug");
    expect(plan.writes).toContainEqual({ fromPath: "/p/old-slug", toPath: "/p/new-slug" });
    expect(plan.writes).toContainEqual({ fromPath: "/studio/old-slug", toPath: "/studio/new-slug" });
  });

  it("deletes the reverse edges so a/b/a loops cannot exist", () => {
    const plan = slugRedirectPlan("a", "b");
    expect(plan.reverse).toContainEqual({ fromPath: "/p/b", toPath: "/p/a" });
    expect(plan.reverse).toContainEqual({ fromPath: "/studio/b", toPath: "/studio/a" });
    expect(plan.writes.every((row) => row.fromPath !== row.toPath)).toBe(true);
  });

  it("writes nothing when the slug did not change", () => {
    expect(slugRedirectPlan("same", "same").writes).toHaveLength(0);
    expect(slugRedirectPlan("", "next").writes).toHaveLength(0);
  });
});
