import { randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "../auth";
import { getDb } from "../db";
import { auditLog, productImages, products, productVersions, redirects, siteSettings } from "../db/schema";
import { deskPrefix } from "../desk-path";
import { dollarsToMinor } from "../money";
import { canPublishPiece } from "../piece-readiness";
import { type ShopSettings, withDefaults } from "../settings";
import { pieceSlug, slugify } from "../slug";
import { slugRedirectPlan } from "../slug-redirects";

export type Snapshot = {
  product: {
    slug: string;
    title: string;
    description: string;
    priceMinor: number | null;
    comparePriceMinor: number | null;
    currency: string;
    categoryId: string | null;
    condition: string;
    quantity: number | null;
    sku: string | null;
    attributes: Record<string, string>;
    tags: string[];
    status: string;
    publishAt: string | null;
    featured: boolean;
    showInStudio: boolean;
    sortOrder: number;
    internalNotes: string;
    deletedAt: string | null;
  };
  images: {
    url: string;
    width: number | null;
    height: number | null;
    blurData: string | null;
    focalX: string;
    focalY: string;
    alt: string;
    sortOrder: number;
  }[];
};
export function refresh() {
  updateTag("catalog");
  updateTag("studio");
  updateTag("settings");
}

export async function go(path: string, note: string, undoId?: string): Promise<never> {
  const prefix = await deskPrefix();
  const target = path.startsWith("/") ? path : "/";
  const url = new URL(target, "http://desk.local");
  url.searchParams.set("note", note);
  if (undoId) url.searchParams.set("undo", undoId);
  const pathname = url.pathname === "/" ? "" : url.pathname;
  redirect(`${prefix}${pathname}?${url.searchParams.toString()}`);
}

export async function actor() {
  try {
    return await requireSession();
  } catch {
    return go("", "Please sign in again.");
  }
}

export async function audit(userId: string | null, action: string, entity: string, entityId: string | null, meta: Record<string, unknown> = {}) {
  const [row] = await getDb().insert(auditLog).values({ userId, action, entity, entityId, meta }).returning({ id: auditLog.id });
  return row?.id ?? "";
}

export async function snapshot(productId: string, label: string, email: string) {
  const db = getDb();
  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!product) return "";
  const images = await db.select().from(productImages).where(eq(productImages.productId, productId)).orderBy(asc(productImages.sortOrder));
  const body: Snapshot = {
    product: {
      slug: product.slug,
      title: product.title,
      description: product.description,
      priceMinor: product.priceMinor,
      comparePriceMinor: product.comparePriceMinor,
      currency: product.currency,
      categoryId: product.categoryId,
      condition: product.condition,
      quantity: product.quantity,
      sku: product.sku,
      attributes: (product.attributes ?? {}) as Record<string, string>,
      tags: product.tags ?? [],
      status: product.status,
      publishAt: product.publishAt?.toISOString() ?? null,
      featured: product.featured,
      showInStudio: product.showInStudio,
      sortOrder: product.sortOrder,
      internalNotes: product.internalNotes,
      deletedAt: product.deletedAt?.toISOString() ?? null,
    },
    images: images.map((image) => ({
      url: image.url,
      width: image.width,
      height: image.height,
      blurData: image.blurData,
      focalX: String(image.focalX),
      focalY: String(image.focalY),
      alt: image.alt,
      sortOrder: image.sortOrder,
    })),
  };
  const [version] = await db.insert(productVersions).values({ productId, label, changedBy: email, snapshot: body }).returning();
  return version.id;
}

export async function unusedSlug(base: string, taken: (slug: string) => Promise<boolean>) {
  const root = slugify(base).slice(0, 60) || "piece";
  let slug = root;
  for (let attempt = 2; attempt < 40; attempt += 1) {
    if (!(await taken(slug))) return slug;
    slug = `${root}-${attempt}`;
  }
  return pieceSlug(randomUUID());
}

export async function uniqueSlug(base: string, currentId?: string) {
  const db = getDb();
  const root = slugify(base).slice(0, 60) || "piece";
  let slug = root;
  for (let attempt = 2; attempt < 40; attempt += 1) {
    const [row] = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).limit(1);
    if (!row || row.id === currentId) return slug;
    slug = `${root}-${attempt}`;
  }
  return pieceSlug(randomUUID());
}

export function money(value: string) {
  try {
    return { ok: true as const, value: dollarsToMinor(value) };
  } catch (error) {
    return { ok: false as const, message: error instanceof Error ? error.message : "Check the price." };
  }
}

export async function readSettings(): Promise<ShopSettings> {
  const [row] = await getDb().select().from(siteSettings).where(eq(siteSettings.key, "shop")).limit(1);
  return withDefaults(row?.value);
}

export async function writeSettings(value: ShopSettings) {
  const db = getDb();
  await db
    .insert(siteSettings)
    .values({ key: "shop", value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
  refresh();
}

async function imageCountOf(productId: string) {
  return getDb().$count(productImages, eq(productImages.productId, productId));
}

/** The one publish/schedule gate, applied wherever a piece enters a public status. */
export async function publishGate(product: { id: string; title: string; deletedAt: Date | null }) {
  return canPublishPiece(product, await imageCountOf(product.id));
}

/** Loop-free redirects when a slug moves — reverse edges are deleted first. */
export async function writeSlugRedirect(fromSlug: string, toSlug: string) {
  const plan = slugRedirectPlan(fromSlug, toSlug);
  if (!plan.writes.length) return;
  const db = getDb();
  for (const edge of plan.reverse) {
    await db.delete(redirects).where(and(eq(redirects.fromPath, edge.fromPath), eq(redirects.toPath, edge.toPath)));
  }
  await db.insert(redirects).values(plan.writes).onConflictDoNothing();
}
export function backTo(formData: FormData) {
  const back = String(formData.get("back") ?? "");
  return back.startsWith("/") && !back.startsWith("//") ? back : undefined;
}
