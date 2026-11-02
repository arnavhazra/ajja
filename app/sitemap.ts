import type { MetadataRoute } from "next";
import { loadCollections, loadShop, loadStudio } from "@/lib/public-data";
import { parseShopQuery } from "@/lib/shop-query";
import { siteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [shop, studio, collections] = await Promise.all([
    loadShop(parseShopQuery({})),
    loadStudio(),
    loadCollections(),
  ]);
  const staticPaths = ["", "/shop", "/studio", "/about", "/visit", "/policies", "/privacy", "/sold", "/search"];
  return [
    ...staticPaths.map((path) => ({ url: `${base}${path || "/"}`, changeFrequency: "weekly" as const, priority: path === "" ? 1 : 0.7 })),
    ...shop.map((product) => ({ url: `${base}/p/${product.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...studio
      .filter((product) => product.status === "draft")
      .map((product) => ({ url: `${base}/studio/${product.slug}`, changeFrequency: "weekly" as const, priority: 0.4 })),
    ...collections.map((collection) => ({ url: `${base}/c/${collection.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
