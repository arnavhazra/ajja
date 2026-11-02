import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb } from "./db";
import { categories, collectionProducts, collections, productImages, products, redirects, testimonials } from "./db/schema";
import { withDefaults } from "./settings";
import { siteSettings } from "./db/schema";
import type { PublicCategory, PublicCollection, PublicImage, PublicProduct } from "./types";
import type { ShopQuery } from "./shop-query";

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
  return rows.map((row) => mapProduct(row, grouped.get(row.id) ?? [], row.categoryId ? catMap.get(row.categoryId) ?? null : null));
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

export async function loadCategories(): Promise<PublicCategory[]> {
  "use cache";
  cacheTag("catalog");
  cacheLife("minutes");
  const rows = await getDb().select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    intro: row.intro,
    imageUrl: row.imageUrl,
    sortOrder: row.sortOrder,
  }));
}

export async function loadShop(query: ShopQuery) {
  "use cache";
  cacheTag("catalog");
  cacheLife("minutes");
  const db = getDb();
  const filters = [listed()];
  if (query.category) {
    const [cat] = await db.select().from(categories).where(eq(categories.slug, query.category)).limit(1);
    if (!cat) return [];
    filters.push(eq(products.categoryId, cat.id));
  }
  if (query.condition) filters.push(eq(products.condition, query.condition));
  if (query.availability === "sold") filters.push(eq(products.status, "sold"));
  if (query.availability === "available") filters.push(sql`${products.status} in ('published', 'scheduled')`);
  if (query.min != null) filters.push(sql`${products.priceMinor} >= ${query.min}`);
  if (query.max != null) filters.push(sql`${products.priceMinor} <= ${query.max}`);
  if (query.q) {
    const like = `%${query.q.replace(/[%_]/g, "")}%`;
    filters.push(sql`(
      ${products.title} ilike ${like}
      or ${products.description} ilike ${like}
      or similarity(${products.title}, ${query.q}) > 0.2
      or similarity(coalesce(${products.description}, ''), ${query.q}) > 0.15
    )`);
  }
  const order =
    query.sort === "price-asc"
      ? sql`${products.priceMinor} asc nulls last`
      : query.sort === "price-desc"
        ? sql`${products.priceMinor} desc nulls last`
        : query.sort === "featured"
          ? sql`${products.featured} desc, ${products.sortOrder} asc`
          : desc(products.createdAt);
  const rows = await db.select().from(products).where(and(...filters)).orderBy(order).limit(300);
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

export async function loadStudioPiece(slug: string) {
  "use cache";
  cacheTag("studio");
  cacheLife("minutes");
  const [row] = await getDb()
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), isNull(products.deletedAt), eq(products.showInStudio, true)))
    .limit(1);
  if (!row || row.status === "hidden") return null;
  const [product] = await hydrate([row]);
  return product;
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

export async function loadFeatured() {
  "use cache";
  cacheTag("catalog");
  cacheLife("minutes");
  const rows = await getDb()
    .select()
    .from(products)
    .where(and(listed(), eq(products.featured, true), sql`${products.status} <> 'sold'`))
    .orderBy(asc(products.sortOrder), desc(products.createdAt))
    .limit(8);
  return hydrate(rows);
}

export async function loadNewArrivals() {
  "use cache";
  cacheTag("catalog");
  cacheLife("minutes");
  const rows = await getDb()
    .select()
    .from(products)
    .where(and(listed(), sql`${products.status} <> 'sold'`))
    .orderBy(desc(products.createdAt))
    .limit(8);
  return hydrate(rows);
}

export async function loadReduced() {
  "use cache";
  cacheTag("catalog");
  cacheLife("minutes");
  const rows = await getDb()
    .select()
    .from(products)
    .where(and(listed(), sql`${products.comparePriceMinor} > ${products.priceMinor}`))
    .orderBy(desc(products.updatedAt))
    .limit(8);
  return hydrate(rows);
}

export async function loadCollections(): Promise<PublicCollection[]> {
  "use cache";
  cacheTag("catalog");
  cacheLife("minutes");
  const db = getDb();
  const rows = await db.select().from(collections).orderBy(asc(collections.sortOrder));
  const links = rows.length
    ? await db.select().from(collectionProducts).where(inArray(collectionProducts.collectionId, rows.map((row) => row.id)))
    : [];
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    intro: row.intro,
    imageUrl: row.imageUrl,
    sortOrder: row.sortOrder,
    productIds: links.filter((link) => link.collectionId === row.id).sort((a, b) => a.sortOrder - b.sortOrder).map((link) => link.productId),
  }));
}

export async function loadCollection(slug: string) {
  "use cache";
  cacheTag("catalog");
  cacheLife("minutes");
  const all = await loadCollections();
  const collection = all.find((item) => item.slug === slug);
  if (!collection) return null;
  if (!collection.productIds.length) return { collection, products: [] };
  const rows = await getDb().select().from(products).where(and(listed(), inArray(products.id, collection.productIds)));
  const hydrated = await hydrate(rows);
  const order = new Map(collection.productIds.map((id, index) => [id, index]));
  hydrated.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return { collection, products: hydrated };
}

export async function loadTestimonials() {
  "use cache";
  cacheTag("settings");
  cacheLife("minutes");
  const rows = await getDb()
    .select()
    .from(testimonials)
    .where(and(eq(testimonials.status, "published"), sql`length(trim(${testimonials.consentNote})) > 0`))
    .orderBy(asc(testimonials.sortOrder));
  return rows.map((row) => ({ id: row.id, name: row.name, text: row.text, photoUrl: row.photoUrl }));
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
