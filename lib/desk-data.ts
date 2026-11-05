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

export async function loadDeskPieces(input: { q?: string; status?: string; trash?: boolean; page?: number }) {
  const filters = [input.trash ? sql`${products.deletedAt} is not null` : isNull(products.deletedAt)];
  if (input.status) filters.push(eq(products.status, input.status));
  if (input.q) {
    const like = `%${input.q.replace(/[%_]/g, "")}%`;
    filters.push(sql`(${products.title} ilike ${like} or coalesce(${products.sku}, '') ilike ${like})`);
  }
  const db = getDb();
  const page = Math.max(0, input.page ?? 0);
  const rows = await db.select().from(products).where(and(...filters)).orderBy(desc(products.updatedAt)).limit(51).offset(page * 50);
  const hasMore = rows.length > 50;
  if (hasMore) rows.pop();
  const images = rows.length
    ? await db.select().from(productImages).where(inArray(productImages.productId, rows.map((row) => row.id))).orderBy(asc(productImages.sortOrder))
    : [];
  return {
    rows: rows.map((row) => ({ ...row, image: images.find((image) => image.productId === row.id) ?? null })),
    page,
    hasMore,
  };
}

/** Global "needs" counts for the Pieces chips — independent of the current page. */
export async function loadNeedCounts() {
  const db = getDb();
  const result = await db.execute<{ photo: number; title: number; group: number; size: number; price: number }>(sql`
    select
      count(*) filter (where not exists (select 1 from product_images i where i.product_id = p.id))::int as photo,
      count(*) filter (where trim(p.title) = '')::int as title,
      count(*) filter (where p.category_id is null)::int as "group",
      count(*) filter (where coalesce(p.attributes->>'size','') = '')::int as size,
      count(*) filter (where p.price_minor is null)::int as price
    from products p where p.deleted_at is null`);
  const row = result.rows[0];
  return {
    photo: Number(row?.photo ?? 0),
    title: Number(row?.title ?? 0),
    group: Number(row?.group ?? 0),
    size: Number(row?.size ?? 0),
    price: Number(row?.price ?? 0),
  };
}

export async function loadNavCounts() {
  const db = getDb();
  const [waiting] = await db.select({ count: count() }).from(enquiries).where(eq(enquiries.status, "new"));
  const [drafts] = await db.select({ count: count() }).from(products).where(and(isNull(products.deletedAt), eq(products.status, "draft")));
  const [stale] = await db
    .select({ count: count() })
    .from(enquiries)
    .where(and(eq(enquiries.status, "new"), sql`${enquiries.createdAt} < now() - interval '3 days'`));
  return { waiting: waiting?.count ?? 0, review: drafts?.count ?? 0, stale: stale?.count ?? 0 };
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

export async function loadMessages(status?: string, q?: string) {
  const filters = status ? [eq(enquiries.status, status)] : [];
  if (q) {
    const like = `%${q.replace(/[%_]/g, "")}%`;
    filters.push(sql`(${enquiries.name} ilike ${like} or ${enquiries.message} ilike ${like} or ${enquiries.contact} ilike ${like})`);
  }
  const staleBefore = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const rows = await getDb()
    .select()
    .from(enquiries)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(enquiries.createdAt))
    .limit(200);
  return rows.map((row) => ({ ...row, stale: row.status === "new" && row.createdAt < staleBefore }));
}

export async function loadReview(skip?: string) {
  const db = getDb();
  // The sprint covers every non-trashed piece that still needs a name or a price.
  const rows = await db
    .select()
    .from(products)
    .where(
      and(
        isNull(products.deletedAt),
        sql`(trim(${products.title}) = '' or ${products.title} ilike 'title not written yet%' or ${products.priceMinor} is null)`,
      ),
    )
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
  const top = await db.execute<{ id: string; title: string; slug: string; attributes: Record<string, string> | null; imageUrl: string | null; count: number }>(sql`
    select p.id, p.title, p.slug, p.attributes,
      (select i.url from product_images i where i.product_id = p.id order by i.sort_order limit 1) as "imageUrl",
      count(*)::int as count
    from events e
    join products p on p.id = e.product_id
    where e.type = 'view' and e.created_at >= ${since} and p.deleted_at is null
    group by p.id
    order by count desc
    limit 5
  `);
  const missing = await db.execute<{ count: number }>(sql`
    select count(*)::int as count from products p
    where p.deleted_at is null and p.status <> 'hidden'
      and (p.price_minor is null or not exists (select 1 from product_images i where i.product_id = p.id))
  `);
  const needs = await db.execute<{ needsName: number; needsPrice: number }>(sql`
    select
      count(*) filter (where trim(p.title) = '' or p.title ilike 'title not written yet%' or p.title ilike 'studio study%')::int as "needsName",
      count(*) filter (where p.price_minor is null)::int as "needsPrice"
    from products p where p.deleted_at is null and p.status in ('draft','published','scheduled')
  `);
  const [oldest] = await db
    .select({ createdAt: enquiries.createdAt })
    .from(enquiries)
    .where(eq(enquiries.status, "new"))
    .orderBy(asc(enquiries.createdAt))
    .limit(1);
  const sprintResult = await db.execute<{ count: number }>(sql`
    select count(*)::int as count from products p
    where p.deleted_at is null
      and (trim(p.title) = '' or p.title ilike 'title not written yet%' or p.price_minor is null)`);
  const views = await db.execute<{ day: string; count: number }>(sql`
    select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day, count(*)::int as count
    from events where type = 'view' and created_at >= ${since}
    group by 1 order by 1
  `);
  const byDay = new Map(views.rows.map((row) => [row.day, row.count]));
  const sparkline = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return { day, count: byDay.get(day) ?? 0 };
  });
  return {
    live: live?.count ?? 0,
    drafts: drafts?.count ?? 0,
    waiting: waiting?.count ?? 0,
    waitingOldestDays: oldest?.createdAt ? Math.floor((Date.now() - oldest.createdAt.getTime()) / 86400000) : 0,
    needsName: Number(needs.rows[0]?.needsName ?? 0),
    needsPrice: Number(needs.rows[0]?.needsPrice ?? 0),
    sprint: Number(sprintResult.rows[0]?.count ?? 0),
    whatsapp: Number(taps.rows.find((row) => row.type === "whatsapp")?.count ?? 0),
    calls: Number(taps.rows.find((row) => row.type === "call")?.count ?? 0),
    top: top.rows,
    sparkline,
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
