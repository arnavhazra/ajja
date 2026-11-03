import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb } from "./db";
import { categories, productImages, products, redirects } from "./db/schema";
import { withDefaults } from "./settings";
import { siteSettings } from "./db/schema";
import type { PublicImage, PublicProduct } from "./types";
import { pigmentFromDataUri, type Pigment } from "./pigment";

function mapImage(image: typeof productImages.$inferSelect): PublicImage {
  return {
    id: image.id,
    url: image.url,
    width: image.width,
    height: image.height,
    blurData: image.blurData,
    focalX: Number(image.focalX),
    focalY: Number(image.focalY),
    alt: image.alt,
    sortOrder: image.sortOrder,
  };
}

function mapProduct(
  row: typeof products.$inferSelect,
  images: PublicImage[],
  category: { name: string; slug: string } | null,
  pigment: Pigment,
): PublicProduct {
  const attributes = row.attributes && typeof row.attributes === "object" ? (row.attributes as Record<string, string>) : {};
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    priceMinor: row.priceMinor,
    comparePriceMinor: row.comparePriceMinor,
    currency: row.currency,
    condition: row.condition,
    quantity: row.quantity,
    sku: row.sku,
    attributes,
    tags: row.tags ?? [],
    status: row.status,
    featured: row.featured,
    showInStudio: row.showInStudio,
    categoryId: row.categoryId,
    categoryName: category?.name ?? null,
    categorySlug: category?.slug ?? null,
    images,
    pigment: pigment.hex,
    pigmentInk: pigment.ink,
    createdAt: row.createdAt.toISOString(),
  };
}

async function hydrate(rows: (typeof products.$inferSelect)[]) {
  if (!rows.length) return [];
  const db = getDb();
  const ids = rows.map((row) => row.id);
  const images = await db.select().from(productImages).where(inArray(productImages.productId, ids)).orderBy(asc(productImages.sortOrder));
  const categoryIds = [...new Set(rows.map((row) => row.categoryId).filter((id): id is string => Boolean(id)))];
  const cats = categoryIds.length ? await db.select().from(categories).where(inArray(categories.id, categoryIds)) : [];
  const catMap = new Map(cats.map((cat) => [cat.id, cat]));
  const grouped = new Map<string, PublicImage[]>();
  for (const image of images) {
    const list = grouped.get(image.productId) ?? [];
    list.push(mapImage(image));
    grouped.set(image.productId, list);
  }
  const pigments = await Promise.all(rows.map((row) => pigmentFromDataUri(grouped.get(row.id)?.[0]?.blurData ?? null)));
  return rows.map((row, index) =>
    mapProduct(row, grouped.get(row.id) ?? [], row.categoryId ? catMap.get(row.categoryId) ?? null : null, pigments[index]),
  );
}

function listed() {
  return sql`(
    ${products.deletedAt} is null
    and (
      ${products.status} in ('published', 'sold')
      or (${products.status} = 'scheduled' and ${products.publishAt} is not null and ${products.publishAt} <= now())
    )
  )`;
}

export async function getSettings() {
  "use cache";
  cacheTag("settings");
  cacheLife("minutes");
  const db = getDb();
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, "shop")).limit(1);
  return withDefaults(row?.value);
}

export async function loadManifest() {
  "use cache";
  cacheTag("catalog");
  cacheLife("minutes");
  const rows = await getDb()
    .select()
    .from(products)
    .where(listed())
    .orderBy(desc(products.createdAt))
    .limit(300);
  return hydrate(rows);
}

export async function loadProduct(slug: string) {
  "use cache";
  cacheTag("catalog");
  cacheLife("minutes");
  const db = getDb();
  const [row] = await db.select().from(products).where(and(eq(products.slug, slug), listed())).limit(1);
  if (!row) {
    const [redirect] = await db.select().from(redirects).where(eq(redirects.fromPath, `/p/${slug}`)).limit(1);
    return { product: null, redirect: redirect?.toPath ?? null };
  }
  const [product] = await hydrate([row]);
  return { product, redirect: null };
}

export async function loadStudio() {
  "use cache";
  cacheTag("studio");
  cacheLife("minutes");
  const rows = await getDb()
    .select()
    .from(products)
    .where(and(isNull(products.deletedAt), eq(products.showInStudio, true), sql`${products.status} <> 'hidden'`))
    .orderBy(desc(products.createdAt))
    .limit(300);
  return hydrate(rows);
}

export async function loadRelated(product: PublicProduct) {
  "use cache";
  cacheTag("catalog");
  cacheLife("minutes");
  if (!product.categoryId) return [];
  const rows = await getDb()
    .select()
    .from(products)
    .where(and(listed(), eq(products.categoryId, product.categoryId), sql`${products.id} <> ${product.id}`))
    .orderBy(desc(products.createdAt))
    .limit(4);
  return hydrate(rows);
}

export async function loadSold(limit = 8) {
  "use cache";
  cacheTag("catalog");
  cacheLife("minutes");
  const rows = await getDb()
    .select()
    .from(products)
    .where(and(isNull(products.deletedAt), eq(products.status, "sold")))
    .orderBy(desc(products.updatedAt))
    .limit(limit);
  return hydrate(rows);
}

export async function loadSaved(slugs: string[]) {
  const clean = slugs.map((slug) => slug.slice(0, 80)).filter(Boolean).slice(0, 40);
  if (!clean.length) return [];
  const rows = await getDb()
    .select()
    .from(products)
    .where(and(isNull(products.deletedAt), inArray(products.slug, clean), sql`${products.status} <> 'hidden'`));
  return hydrate(rows);
}
