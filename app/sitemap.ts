import type { MetadataRoute } from "next";
import { loadManifest } from "@/lib/public-data";
import { siteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const manifest = await loadManifest();
  const staticPaths = ["", "/policies", "/privacy"];
  return [
    ...staticPaths.map((path) => ({
      url: `${base}${path || "/"}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.5,
    })),
    ...manifest.map((product) => ({
      url: `${base}/p/${product.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
