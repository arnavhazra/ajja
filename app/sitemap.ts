import type { MetadataRoute } from "next";
import { buildIndex } from "@/lib/category-index";
import { hasRealTitle } from "@/lib/piece-title";
import { loadCategories, loadManifest } from "@/lib/public-data";
import { siteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [manifest, categories] = await Promise.all([loadManifest(), loadCategories()]);
  const entries = buildIndex(categories, manifest);
  const staticPaths = ["", "/policies", "/privacy", "/category/all"];
  return [
    ...staticPaths.map((path) => ({
      url: `${base}${path || "/"}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.5,
    })),
    ...entries.map((entry) => ({
      url: `${base}/category/${entry.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    // Unnamed pieces are noindexed on their pages — leave them out of the sitemap.
    ...manifest.filter((product) => hasRealTitle(product.title)).map((product) => ({
      url: `${base}/p/${product.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
