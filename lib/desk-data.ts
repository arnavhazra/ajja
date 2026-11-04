import "server-only";

import { notFound } from "next/navigation";
import { and, asc, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getSession } from "./auth";
import { getDb } from "./db";
import {
  auditLog,
  categories,
  collectionProducts,
  collections,
  enquiries,
  productImages,
  products,
  testimonials,
} from "./db/schema";
import { missingFields } from "./missing";

export async function requireDesk() {
  const session = await getSession();
  if (!session) notFound();
  return session;
}

export async function loadDeskPieces(input: { q?: string; status?: string; trash?: boolean }) {
  const filters = [input.trash ? sql`${products.deletedAt} is not null` : isNull(products.deletedAt)];
  if (input.status) filters.push(eq(products.status, input.status));
  if (input.q) {
    const like = `%${input.q.replace(/[%_]/g, "")}%`;
    filters.push(sql`(${products.title} ilike ${like} or coalesce(${products.sku}, '') ilike ${like})`);
  }
  const db = getDb();
  const rows = await db.select().from(products).where(and(...filters)).orderBy(desc(products.updatedAt)).limit(300);
  const images = rows.length
    ? await db.select().from(productImages).where(inArray(productImages.productId, rows.map((row) => row.id))).orderBy(asc(productImages.sortOrder))
    : [];
  return rows.map((row) => ({ ...row, image: images.find((image) => image.productId === row.id) ?? null }));
}

export async function loadNavCounts() {
  const db = getDb();
  const [waiting] = await db.select({ count: count() }).from(enquiries).where(eq(enquiries.status, "new"));
  const [drafts] = await db.select({ count: count() }).from(products).where(and(isNull(products.deletedAt), eq(products.status, "draft")));
  return { waiting: waiting?.count ?? 0, review: drafts?.count ?? 0 };
}

export async function loadPieceNeighbors(id: string) {
  const rows = await getDb()
    .select({ id: products.id })
    .from(products)
    .where(isNull(products.deletedAt))
    .orderBy(desc(products.updatedAt))
    .limit(500);
  const index = rows.findIndex((row) => row.id === id);
  return { prevId: rows[index - 1]?.id ?? "", nextId: rows[index + 1]?.id ?? "" };
}

export async function loadDeskPiece(id: string) {
  const db = getDb();
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) return null;
  const images = await db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(asc(productImages.sortOrder));
  const groups = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
  return { product, images, groups };
}

export async function loadGroups() {
  const db = getDb();
  const groups = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
  const sets = await db.select().from(collections).orderBy(asc(collections.sortOrder), asc(collections.name));
  const links = sets.length
    ? await db.select().from(collectionProducts).where(inArray(collectionProducts.collectionId, sets.map((set) => set.id)))
    : [];
  const pieces = await db
    .select({ id: products.id, title: products.title, slug: products.slug })
    .from(products)
    .where(isNull(products.deletedAt))
    .orderBy(desc(products.createdAt));
  return { groups, sets, links, pieces };
}

export async function loadMessages(status?: string) {
  const filters = status ? [eq(enquiries.status, status)] : [];
  return getDb()
    .select()
    .from(enquiries)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(enquiries.createdAt))
    .limit(200);
}

export async function loadReview(skip?: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.status, "draft"), isNull(products.deletedAt)))
    .orderBy(asc(products.createdAt));
  const start = skip ? Math.max(0, rows.findIndex((row) => row.id === skip) + 1) : 0;
  const product = rows[start];
  if (!product) return null;
  const images = await db.select().from(productImages).where(eq(productImages.productId, product.id)).orderBy(asc(productImages.sortOrder));
  return { product, images, missing: missingFields(product, images), remaining: rows.length - start, nextId: rows[start + 1]?.id ?? "" };
}

export async function loadHistory() {
  return getDb().select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(100);
}

export async function loadQuotes() {
  return getDb().select().from(testimonials).orderBy(asc(testimonials.sortOrder));
}

export async function loadDashboard() {
  const db = getDb();
  const [live] = await db.select({ count: count() }).from(products).where(and(isNull(products.deletedAt), eq(products.status, "published")));
  const [drafts] = await db.select({ count: count() }).from(products).where(and(isNull(products.deletedAt), eq(products.status, "draft")));
  const [waiting] = await db.select({ count: count() }).from(enquiries).where(eq(enquiries.status, "new"));
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const taps = await db.execute<{ type: string; count: number }>(
    sql`select type, count(*)::int as count from events where created_at >= ${since} and type in ('whatsapp', 'call') group by type`,
  );
  const top = await db.execute<{ title: string; slug: string; count: number }>(sql`
    select coalesce(nullif(p.title, ''), 'Studio Study') as title, p.slug, count(*)::int as count
    from events e
    join products p on p.id = e.product_id
    where e.type = 'view' and e.created_at >= ${since}
    group by p.title, p.slug
    order by count desc
    limit 5
  `);
  const missing = await db.execute<{ count: number }>(sql`
    select count(*)::int as count from products p
    where p.deleted_at is null and p.status <> 'hidden'
      and (p.price_minor is null or not exists (select 1 from product_images i where i.product_id = p.id))
  `);
  return {
    live: live?.count ?? 0,
    drafts: drafts?.count ?? 0,
    waiting: waiting?.count ?? 0,
    whatsapp: Number(taps.rows.find((row) => row.type === "whatsapp")?.count ?? 0),
    calls: Number(taps.rows.find((row) => row.type === "call")?.count ?? 0),
    top: top.rows,
    missing: Number(missing.rows[0]?.count ?? 0),
  };
}

export async function loadInsights(days: number) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const db = getDb();
  const counts = await db.execute<{ type: string; count: number }>(
    sql`select type, count(*)::int as count from events where created_at >= ${since} group by type order by count desc`,
  );
  const top = await db.execute<{ title: string; count: number }>(sql`
    select coalesce(nullif(p.title, ''), 'Studio Study') as title, count(*)::int as count
    from events e join products p on p.id = e.product_id
    where e.type = 'view' and e.created_at >= ${since}
    group by p.title order by count desc limit 5
  `);
  const searches = await db.execute<{ term: string; count: number }>(sql`
    select term, count(*)::int as count from events
    where type in ('search', 'search-empty') and created_at >= ${since} and term is not null and term <> ''
    group by term order by count desc limit 8
  `);
  const empty = await db.execute<{ term: string; count: number }>(sql`
    select term, count(*)::int as count from events
    where type = 'search-empty' and created_at >= ${since} and term is not null and term <> ''
    group by term order by count desc limit 8
  `);
  return { counts: counts.rows, top: top.rows, searches: searches.rows, empty: empty.rows };
}

export async function loadPosterPieces() {
  return getDb()
    .select({ id: products.id, title: products.title, slug: products.slug, status: products.status })
    .from(products)
    .where(and(isNull(products.deletedAt), eq(products.status, "published")))
    .orderBy(asc(products.title));
}
