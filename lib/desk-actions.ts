"use server";

import { createHash, randomUUID } from "node:crypto";
import { del } from "@vercel/blob";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import { changePassword, requestCode, requireSession, signOut, verifyCode, verifyPassword, verifyStaff } from "./auth";
import { parseCsv } from "./csv";
import { getDb } from "./db";
import {
  auditLog,
  categories,
  collectionProducts,
  collections,
  enquiries,
  productImages,
  products,
  productVersions,
  redirects,
  siteSettings,
  testimonials,
} from "./db/schema";
import { deskPrefix } from "./desk-path";
import { assertBlobUrl, storeImage } from "./images";
import { dollarsToMinor } from "./money";
import { passwordChangeSchema, passwordSignInSchema, pieceSchema } from "./schemas";
import { defaultSettings, type ShopSettings, withDefaults } from "./settings";
import { pieceSlug, slugify } from "./slug";
import { parseNewYork } from "./time";
import { WEEKDAY_NAMES } from "./open-now";

type Snapshot = {
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

function refresh() {
  updateTag("catalog");
  updateTag("studio");
  updateTag("settings");
}

async function go(path: string, note: string, undoId?: string): Promise<never> {
  const prefix = await deskPrefix();
  const target = path.startsWith("/") ? path : "/";
  const url = new URL(target, "http://desk.local");
  url.searchParams.set("note", note);
  if (undoId) url.searchParams.set("undo", undoId);
  const pathname = url.pathname === "/" ? "" : url.pathname;
  redirect(`${prefix}${pathname}?${url.searchParams.toString()}`);
}

async function actor() {
  try {
    return await requireSession();
  } catch {
    return go("", "Please sign in again.");
  }
}

async function audit(userId: string | null, action: string, entity: string, entityId: string | null, meta: Record<string, string> = {}) {
  await getDb().insert(auditLog).values({ userId, action, entity, entityId, meta });
}

async function snapshot(productId: string, label: string, email: string) {
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

async function unusedSlug(base: string, taken: (slug: string) => Promise<boolean>) {
  const root = slugify(base).slice(0, 60) || "piece";
  let slug = root;
  for (let attempt = 2; attempt < 40; attempt += 1) {
    if (!(await taken(slug))) return slug;
    slug = `${root}-${attempt}`;
  }
  return pieceSlug(randomUUID());
}

async function uniqueSlug(base: string, currentId?: string) {
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

function money(value: string) {
  try {
    return { ok: true as const, value: dollarsToMinor(value) };
  } catch (error) {
    return { ok: false as const, message: error instanceof Error ? error.message : "Check the price." };
  }
}

async function readSettings(): Promise<ShopSettings> {
  const [row] = await getDb().select().from(siteSettings).where(eq(siteSettings.key, "shop")).limit(1);
  return withDefaults(row?.value);
}

async function writeSettings(value: ShopSettings) {
  const db = getDb();
  await db
    .insert(siteSettings)
    .values({ key: "shop", value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
  refresh();
}

async function dropBlobIfUnused(url: string) {
  const rows = await getDb().select({ id: productImages.id }).from(productImages).where(eq(productImages.url, url)).limit(1);
  if (!rows.length) await del(url).catch(() => undefined);
}

export async function sendSignInCode(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const result = await requestCode(email);
  const query = `/?code=1${email ? `&email=${encodeURIComponent(email)}` : ""}`;
  return go(query, result.message);
}

export async function completeSignIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const result = await verifyCode(email, String(formData.get("code") ?? ""));
  if (!result.ok) {
    const query = `/?code=1${email ? `&email=${encodeURIComponent(email)}` : ""}`;
    return go(query, result.message);
  }
  const prefix = await deskPrefix();
  redirect(prefix || "/");
}

export async function completePasswordSignIn(formData: FormData) {
  const parsed = passwordSignInSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return go("", parsed.error.issues[0]?.message ?? "Those details did not work.");
  const result = await verifyPassword(parsed.data.email, parsed.data.password);
  if (!result.ok) return go("", result.message);
  const prefix = await deskPrefix();
  redirect(prefix || "/");
}

export async function updatePassword(formData: FormData) {
  const session = await requireSession();
  const parsed = passwordChangeSchema.safeParse({
    current: formData.get("current") ?? "",
    next: formData.get("next"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return go("/account", parsed.error.issues[0]?.message ?? "That password did not work.");
  if (!session.userId) return go("/account", "Please sign in again.");
  const result = await changePassword(session.userId, parsed.data.current, parsed.data.next);
  return go("/account", result.message);
}

export async function completeStaffSignIn(formData: FormData) {
  const result = await verifyStaff(
    String(formData.get("email") ?? ""),
    String(formData.get("password") ?? ""),
    String(formData.get("token") ?? ""),
  );
  if (!result.ok) return go("/?staff=1", result.message);
  const prefix = await deskPrefix();
  redirect(prefix || "/");
}

export async function leaveDesk() {
  await signOut();
  const prefix = await deskPrefix();
  redirect(prefix || "/");
}

export async function ingestUpload(url: string, filename: string) {
  const session = await actor();
  try {
    assertBlobUrl(url);
    const response = await fetch(url);
    if (!response.ok) return { ok: false as const, message: "That photo did not arrive." };
    const bytes = Buffer.from(await response.arrayBuffer());
    const hash = createHash("sha256").update(bytes).digest("hex");
    const existing = await getDb().select({ id: products.id }).from(products).where(eq(products.sourceHash, hash)).limit(1);
    if (existing.length) {
      await del(url).catch(() => undefined);
      return { ok: false as const, message: "That photograph is already in the desk." };
    }
    const image = await storeImage(bytes, "pieces/photo.webp");
    await del(url).catch(() => undefined);
    const id = randomUUID();
    const db = getDb();
    await db.insert(products).values({
      id,
      slug: pieceSlug(id),
      title: "",
      status: "draft",
      sourceHash: hash,
      currency: "USD",
      attributes: { originalFile: filename },
    });
    await db.insert(productImages).values({
      productId: id,
      url: image.url,
      width: image.width,
      height: image.height,
      blurData: image.blurData,
      alt: "",
    });
    await audit(session.userId, "Added a piece", "product", id, { file: filename });
    refresh();
    return { ok: true as const, message: "Draft saved.", id };
  } catch (error) {
    return { ok: false as const, message: error instanceof Error ? error.message : "The photo could not be saved." };
  }
}

export async function addPhotoToPiece(productId: string, url: string) {
  const session = await actor();
  const db = getDb();
  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!product) return { ok: false as const, message: "That piece is not here." };
  try {
    assertBlobUrl(url);
    const response = await fetch(url);
    const bytes = Buffer.from(await response.arrayBuffer());
    const image = await storeImage(bytes, "pieces/photo.webp");
    await del(url).catch(() => undefined);
    const undoId = await snapshot(productId, "Added a photo", session.email);
    const current = await db.select().from(productImages).where(eq(productImages.productId, productId));
    await db.insert(productImages).values({
      productId,
      url: image.url,
      width: image.width,
      height: image.height,
      blurData: image.blurData,
      alt: "",
      sortOrder: current.length,
    });
    await audit(session.userId, "Added a photo", "product", productId);
    refresh();
    return { ok: true as const, message: "Photo added.", undoId };
  } catch (error) {
    return { ok: false as const, message: error instanceof Error ? error.message : "The photo could not be saved." };
  }
}

export async function savePiece(formData: FormData) {
  const session = await actor();
  const parsed = pieceSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    price: formData.get("price") ?? "",
    compare: formData.get("compare") ?? "",
    categoryId: formData.get("categoryId") ?? "",
    condition: formData.get("condition") ?? "",
    size: formData.get("size") ?? "",
    details: formData.get("details") ?? "",
    quantity: formData.get("quantity") ?? "",
    sku: formData.get("sku") ?? "",
    tags: formData.get("tags") ?? "",
    status: formData.get("status"),
    publishAt: formData.get("publishAt") ?? "",
    featured: formData.get("featured") === "on",
    showInStudio: formData.get("showInStudio") === "on",
    internalNotes: formData.get("internalNotes") ?? "",
  });
  const id = String(formData.get("id") ?? "");
  if (!parsed.success) return go(`/pieces/${id}`, parsed.error.issues[0]?.message ?? "Check this piece.");
  const price = money(parsed.data.price);
  if (!price.ok) return go(`/pieces/${id}`, price.message);
  const compare = money(parsed.data.compare);
  if (!compare.ok) return go(`/pieces/${id}`, compare.message);
  let comparePrice = compare.value;
  let note = "Saved.";
  if (comparePrice != null && (price.value == null || comparePrice <= price.value)) {
    comparePrice = null;
    note = "Saved. The crossed-out price has to be higher, so it was cleared.";
  }
  const publishAt = parsed.data.status === "scheduled" ? parseNewYork(parsed.data.publishAt) : null;
  if (parsed.data.status === "scheduled" && !publishAt) return go(`/pieces/${id}`, "Add the date and time to schedule this piece.");
  const quantity = parsed.data.quantity.trim() ? Number(parsed.data.quantity) : null;
  if (parsed.data.quantity.trim() && !Number.isInteger(quantity)) return go(`/pieces/${id}`, "Quantity should be a whole number, or blank.");
  const db = getDb();
  const [current] = await db.select().from(products).where(eq(products.id, parsed.data.id)).limit(1);
  if (!current) return go("/pieces", "That piece is not here.");
  const undoId = await snapshot(current.id, "Edited a piece", session.email);
  const attributes = { ...((current.attributes ?? {}) as Record<string, string>) };
  attributes.size = parsed.data.size;
  attributes.details = parsed.data.details;
  for (const [key, value] of formData.entries()) {
    if (typeof key === "string" && key.startsWith("field:") && typeof value === "string") {
      attributes[key.slice(6)] = value.trim();
    }
  }
  const custom = String(formData.get("custom") ?? "");
  for (const line of custom.split("\n")) {
    const split = line.indexOf(":");
    if (split < 1) continue;
    const key = slugify(line.slice(0, split));
    if (key) attributes[key] = line.slice(split + 1).trim();
  }
  let slug = current.slug;
  if (parsed.data.title.trim() && (current.slug.startsWith("piece-") || current.title !== parsed.data.title)) {
    const nextSlug = await uniqueSlug(parsed.data.title, current.id);
    if (nextSlug !== current.slug) {
      await db.insert(redirects).values({ fromPath: `/p/${current.slug}`, toPath: `/p/${nextSlug}` }).onConflictDoNothing();
      await db.insert(redirects).values({ fromPath: `/studio/${current.slug}`, toPath: `/studio/${nextSlug}` }).onConflictDoNothing();
      slug = nextSlug;
    }
  }
  await db
    .update(products)
    .set({
      slug,
      title: parsed.data.title,
      description: parsed.data.description,
      priceMinor: price.value,
      comparePriceMinor: comparePrice,
      categoryId: parsed.data.categoryId || null,
      condition: parsed.data.condition,
      quantity,
      sku: parsed.data.sku || null,
      attributes,
      tags: parsed.data.tags.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 20),
      status: parsed.data.status,
      publishAt,
      featured: parsed.data.featured,
      showInStudio: parsed.data.showInStudio,
      internalNotes: parsed.data.internalNotes,
      updatedAt: new Date(),
    })
    .where(eq(products.id, current.id));
  await audit(session.userId, "Edited a piece", "product", current.id);
  refresh();
  return go(`/pieces/${current.id}`, note, undoId);
}

async function setStatus(id: string, status: "published" | "sold" | "hidden" | "draft", label: string) {
  const session = await actor();
  const undoId = await snapshot(id, label, session.email);
  await getDb().update(products).set({ status, updatedAt: new Date() }).where(eq(products.id, id));
  await audit(session.userId, label, "product", id);
  refresh();
  return go(`/pieces/${id}`, label, undoId);
}

export async function publishPiece(formData: FormData) {
  return setStatus(String(formData.get("id")), "published", "Put on the site");
}

export async function sellPiece(formData: FormData) {
  return setStatus(String(formData.get("id")), "sold", "Marked sold");
}

export async function hidePiece(formData: FormData) {
  return setStatus(String(formData.get("id")), "hidden", "Hidden");
}

export async function draftPiece(formData: FormData) {
  return setStatus(String(formData.get("id")), "draft", "Moved back to draft");
}

export async function trashPiece(formData: FormData) {
  const session = await actor();
  const id = String(formData.get("id"));
  const undoId = await snapshot(id, "Moved to trash", session.email);
  await getDb().update(products).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(products.id, id));
  await audit(session.userId, "Moved to trash", "product", id);
  refresh();
  return go("/pieces", "Moved to trash. It stays for 30 days.", undoId);
}

export async function restorePiece(formData: FormData) {
  const session = await actor();
  const id = String(formData.get("id"));
  const undoId = await snapshot(id, "Restored from trash", session.email);
  await getDb().update(products).set({ deletedAt: null, updatedAt: new Date() }).where(eq(products.id, id));
  await audit(session.userId, "Restored from trash", "product", id);
  refresh();
  return go(`/pieces/${id}`, "Restored.", undoId);
}

export async function duplicatePiece(formData: FormData) {
  const session = await actor();
  const id = String(formData.get("id"));
  const db = getDb();
  const [current] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!current) return go("/pieces", "That piece is not here.");
  const images = await db.select().from(productImages).where(eq(productImages.productId, id));
  const copyId = randomUUID();
  await db.insert(products).values({
    id: copyId,
    slug: pieceSlug(copyId),
    title: current.title,
    description: current.description,
    priceMinor: current.priceMinor,
    comparePriceMinor: current.comparePriceMinor,
    currency: current.currency,
    categoryId: current.categoryId,
    condition: current.condition,
    quantity: current.quantity,
    sku: null,
    attributes: current.attributes,
    tags: current.tags,
    status: "draft",
    featured: false,
    showInStudio: current.showInStudio,
    internalNotes: current.internalNotes,
    sourceHash: null,
  });
  if (images.length) {
    await db.insert(productImages).values(
      images.map((image) => ({
        productId: copyId,
        url: image.url,
        width: image.width,
        height: image.height,
        blurData: image.blurData,
        focalX: image.focalX,
        focalY: image.focalY,
        alt: image.alt,
        sortOrder: image.sortOrder,
      })),
    );
  }
  await audit(session.userId, "Duplicated a piece", "product", copyId);
  refresh();
  return go(`/pieces/${copyId}`, "Copy saved as a draft.");
}

export async function undoChange(formData: FormData) {
  const session = await actor();
  const id = String(formData.get("id") ?? "");
  const back = String(formData.get("back") ?? "/pieces");
  const db = getDb();
  const [version] = await db.select().from(productVersions).where(eq(productVersions.id, id)).limit(1);
  if (!version?.productId) return go(back.startsWith("/") ? back : "/pieces", "Nothing to undo.");
  const snap = version.snapshot as Snapshot;
  await db
    .update(products)
    .set({
      ...snap.product,
      publishAt: snap.product.publishAt ? new Date(snap.product.publishAt) : null,
      deletedAt: snap.product.deletedAt ? new Date(snap.product.deletedAt) : null,
      updatedAt: new Date(),
    })
    .where(eq(products.id, version.productId));
  await db.delete(productImages).where(eq(productImages.productId, version.productId));
  if (snap.images.length) {
    await db.insert(productImages).values(snap.images.map((image) => ({ ...image, productId: version.productId! })));
  }
  await db.update(productVersions).set({ undoneAt: new Date() }).where(eq(productVersions.id, version.id));
  await audit(session.userId, "Undid a change", "product", version.productId);
  refresh();
  const path = back.startsWith("/") ? back : `/pieces/${version.productId}`;
  return go(path, "Change undone.");
}

export async function saveInline(formData: FormData) {
  const session = await actor();
  const id = String(formData.get("id"));
  const intent = String(formData.get("intent"));
  const db = getDb();
  const undoId = await snapshot(id, "Quick edit", session.email);
  if (intent === "price") {
    const price = money(String(formData.get("price") ?? ""));
    if (!price.ok) return go("/pieces", price.message);
    await db.update(products).set({ priceMinor: price.value, updatedAt: new Date() }).where(eq(products.id, id));
  } else if (intent === "status") {
    const status = String(formData.get("status"));
    if (!["draft", "scheduled", "published", "sold", "hidden"].includes(status)) return go("/pieces", "Choose a status.");
    await db.update(products).set({ status, updatedAt: new Date() }).where(eq(products.id, id));
  }
  await audit(session.userId, "Quick edit", "product", id);
  refresh();
  return go("/pieces", "Saved.", undoId);
}

export async function moveFeatured(formData: FormData) {
  const session = await actor();
  const id = String(formData.get("id"));
  const direction = formData.get("direction") === "up" ? -1 : 1;
  const db = getDb();
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.featured, true), isNull(products.deletedAt)))
    .orderBy(asc(products.sortOrder));
  const index = rows.findIndex((row) => row.id === id);
  const swap = rows[index + direction];
  if (!swap || index < 0) return go("/pieces", "That piece is already at the end.");
  await db.update(products).set({ sortOrder: swap.sortOrder }).where(eq(products.id, id));
  await db.update(products).set({ sortOrder: rows[index].sortOrder }).where(eq(products.id, swap.id));
  await audit(session.userId, "Reordered featured pieces", "product", id);
  refresh();
  return go("/pieces", "Order saved.");
}

export async function bulkApply(formData: FormData) {
  const session = await actor();
  const ids = formData.getAll("id").map(String).filter(Boolean);
  const action = String(formData.get("action") ?? "");
  if (!ids.length) return go("/pieces", "Select at least one piece.");
  const db = getDb();
  let changed = 0;
  let skipped = 0;
  for (const id of ids) {
    const undoIgnored = await snapshot(id, "Bulk change", session.email);
    void undoIgnored;
    if (action === "hide" || action === "publish" || action === "sold" || action === "draft") {
      const status = action === "publish" ? "published" : action === "sold" ? "sold" : action === "hide" ? "hidden" : "draft";
      await db.update(products).set({ status, updatedAt: new Date() }).where(eq(products.id, id));
      changed += 1;
    } else if (action === "trash") {
      await db.update(products).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(products.id, id));
      changed += 1;
    } else if (action === "category") {
      const categoryId = String(formData.get("categoryId") ?? "") || null;
      await db.update(products).set({ categoryId, updatedAt: new Date() }).where(eq(products.id, id));
      changed += 1;
    } else if (action === "percent" || action === "amount") {
      const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
      if (!row || row.priceMinor == null) {
        skipped += 1;
        continue;
      }
      const raw = String(formData.get("value") ?? "");
      let delta = 0;
      if (action === "amount") {
        const parsedAmount = money(raw.replace("-", ""));
        if (!parsedAmount.ok || parsedAmount.value == null) {
          skipped += 1;
          continue;
        }
        delta = parsedAmount.value * (raw.trim().startsWith("-") ? -1 : 1);
      }
      const next = action === "percent" ? Math.round(row.priceMinor * (1 + Number(raw) / 100)) : row.priceMinor + delta;
      if (!Number.isFinite(next)) {
        skipped += 1;
        continue;
      }
      await db.update(products).set({ priceMinor: Math.max(0, next), updatedAt: new Date() }).where(eq(products.id, id));
      changed += 1;
    }
  }
  await audit(session.userId, "Bulk change", "product", ids[0] ?? null, { action, count: String(changed) });
  refresh();
  const skippedNote = skipped ? ` ${skipped} had no price, so they were left alone.` : "";
  return go("/pieces", `${changed} updated.${skippedNote}`, ids.length === 1 ? undefined : undefined);
}

export async function moveImage(formData: FormData) {
  const session = await actor();
  const imageId = String(formData.get("imageId"));
  const direction = formData.get("direction") === "up" ? -1 : 1;
  const db = getDb();
  const [image] = await db.select().from(productImages).where(eq(productImages.id, imageId)).limit(1);
  if (!image) return go("/pieces", "That photo is not here.");
  const images = await db.select().from(productImages).where(eq(productImages.productId, image.productId)).orderBy(asc(productImages.sortOrder));
  const index = images.findIndex((item) => item.id === imageId);
  const swap = images[index + direction];
  if (!swap) return go(`/pieces/${image.productId}`, "That photo is already at the end.");
  await db.update(productImages).set({ sortOrder: swap.sortOrder }).where(eq(productImages.id, image.id));
  await db.update(productImages).set({ sortOrder: image.sortOrder }).where(eq(productImages.id, swap.id));
  await audit(session.userId, "Reordered photos", "product", image.productId);
  refresh();
  return go(`/pieces/${image.productId}`, "Photo order saved.");
}

export async function coverImage(formData: FormData) {
  const session = await actor();
  const imageId = String(formData.get("imageId"));
  const db = getDb();
  const [image] = await db.select().from(productImages).where(eq(productImages.id, imageId)).limit(1);
  if (!image) return go("/pieces", "That photo is not here.");
  const images = await db.select().from(productImages).where(eq(productImages.productId, image.productId)).orderBy(asc(productImages.sortOrder));
  let order = 1;
  for (const item of images) {
    await db.update(productImages).set({ sortOrder: item.id === image.id ? 0 : order++ }).where(eq(productImages.id, item.id));
  }
  await audit(session.userId, "Chose the cover photo", "product", image.productId);
  refresh();
  return go(`/pieces/${image.productId}`, "Cover photo saved.");
}

export async function setAsHeroImage(formData: FormData) {
  const session = await actor();
  const imageId = String(formData.get("imageId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  const db = getDb();

  let image = null;
  if (imageId) {
    const [row] = await db.select().from(productImages).where(eq(productImages.id, imageId)).limit(1);
    image = row ?? null;
  } else if (productId) {
    const [row] = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(asc(productImages.sortOrder))
      .limit(1);
    image = row ?? null;
  }

  if (!image) {
    const target = productId ? `/pieces/${productId}` : "/pieces";
    return go(target, "Add a photo first before choosing it as the homepage hero.");
  }

  const current = await readSettings();
  const next: ShopSettings = {
    ...current,
    heroImage: image.url,
    heroFocalX: Number(image.focalX) || 0.5,
    heroFocalY: Number(image.focalY) || 0.5,
  };
  await writeSettings(next);
  await audit(session.userId, "Set homepage hero photo", "product", image.productId);
  refresh();
  return go(`/pieces/${image.productId}`, "Set as the homepage hero artwork.");
}

export async function savePhoto(formData: FormData) {
  const session = await actor();
  const imageId = String(formData.get("imageId"));
  const focalX = Math.min(1, Math.max(0, Number(formData.get("focalX")) || 0.5));
  const focalY = Math.min(1, Math.max(0, Number(formData.get("focalY")) || 0.5));
  const alt = String(formData.get("alt") ?? "").slice(0, 300);
  const db = getDb();
  const [image] = await db.select().from(productImages).where(eq(productImages.id, imageId)).limit(1);
  if (!image) return go("/pieces", "That photo is not here.");
  const undoId = await snapshot(image.productId, "Edited a photo", session.email);
  await db.update(productImages).set({ focalX: String(focalX), focalY: String(focalY), alt }).where(eq(productImages.id, imageId));
  await audit(session.userId, "Edited a photo", "product", image.productId);
  refresh();
  return go(`/pieces/${image.productId}`, "Photo saved.", undoId);
}

async function replaceImage(imageId: string, bytes: Buffer, label: string) {
  const session = await actor();
  const db = getDb();
  const [image] = await db.select().from(productImages).where(eq(productImages.id, imageId)).limit(1);
  if (!image) return go("/pieces", "That photo is not here.");
  const undoId = await snapshot(image.productId, label, session.email);
  const stored = await storeImage(bytes, "pieces/edited.webp");
  const previous = image.url;
  await db
    .update(productImages)
    .set({ url: stored.url, width: stored.width, height: stored.height, blurData: stored.blurData })
    .where(eq(productImages.id, imageId));
  await dropBlobIfUnused(previous);
  await audit(session.userId, label, "product", image.productId);
  refresh();
  return go(`/pieces/${image.productId}`, `${label}.`, undoId);
}

export async function rotateImage(formData: FormData) {
  const imageId = String(formData.get("imageId"));
  const [image] = await getDb().select().from(productImages).where(eq(productImages.id, imageId)).limit(1);
  if (!image) return go("/pieces", "That photo is not here.");
  const response = await fetch(image.url);
  const input = Buffer.from(await response.arrayBuffer());
  const turned = await sharp(input).rotate(90).toBuffer();
  return replaceImage(imageId, turned, "Turned a photo");
}

export async function cropImage(formData: FormData) {
  const imageId = String(formData.get("imageId"));
  const [image] = await getDb().select().from(productImages).where(eq(productImages.id, imageId)).limit(1);
  if (!image) return go("/pieces", "That photo is not here.");
  const response = await fetch(image.url);
  const input = Buffer.from(await response.arrayBuffer());
  const meta = await sharp(input).metadata();
  const width = meta.width ?? 1;
  const height = meta.height ?? 1;
  const leftRatio = Math.min(0.8, Math.max(0, Number(formData.get("left")) / 100 || 0));
  const topRatio = Math.min(0.8, Math.max(0, Number(formData.get("top")) / 100 || 0));
  const widthRatio = Math.min(1 - leftRatio, Math.max(0.1, Number(formData.get("width")) / 100 || 1));
  const heightRatio = Math.min(1 - topRatio, Math.max(0.1, Number(formData.get("height")) / 100 || 1));
  const extract = {
    left: Math.round(leftRatio * width),
    top: Math.round(topRatio * height),
    width: Math.max(1, Math.round(widthRatio * width)),
    height: Math.max(1, Math.round(heightRatio * height)),
  };
  const cropped = await sharp(input).extract(extract).toBuffer();
  return replaceImage(imageId, cropped, "Cropped a photo");
}

export async function reorderImages(productId: string, orderedIds: string[]) {
  const session = await actor();
  const db = getDb();
  for (const [index, id] of orderedIds.entries()) {
    await db.update(productImages).set({ sortOrder: index }).where(and(eq(productImages.id, id), eq(productImages.productId, productId)));
  }
  await audit(session.userId, "Reordered photos", "product", productId);
  refresh();
  return { ok: true as const, message: "Order saved." };
}

export async function saveCategory(formData: FormData) {
  const session = await actor();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  if (!name) return go("/groups", "Add a name for the group.");
  const intro = String(formData.get("intro") ?? "").trim().slice(0, 500);
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const fields = String(formData.get("fields") ?? "")
    .split(",")
    .map((label) => label.trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((label) => ({ key: slugify(label), label }));
  const db = getDb();
  if (id) {
    await db.update(categories).set({ name, intro, imageUrl: imageUrl || null, fieldSchema: fields }).where(eq(categories.id, id));
  } else {
    const slug = await unusedSlug(name, async (value) => {
      const [row] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, value)).limit(1);
      return Boolean(row);
    });
    await db.insert(categories).values({ name, slug, intro, imageUrl: imageUrl || null, fieldSchema: fields });
  }
  await audit(session.userId, id ? "Renamed a group" : "Added a group", "category", id || name);
  refresh();
  return go("/groups", "Group saved.");
}

export async function moveCategory(formData: FormData) {
  const session = await actor();
  const id = String(formData.get("id"));
  const direction = formData.get("direction") === "up" ? -1 : 1;
  const db = getDb();
  const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder));
  const index = rows.findIndex((row) => row.id === id);
  const swap = rows[index + direction];
  if (!swap || index < 0) return go("/groups", "That group is already at the end.");
  await db.update(categories).set({ sortOrder: swap.sortOrder }).where(eq(categories.id, id));
  await db.update(categories).set({ sortOrder: rows[index].sortOrder }).where(eq(categories.id, swap.id));
  await audit(session.userId, "Reordered groups", "category", id);
  refresh();
  return go("/groups", "Order saved.");
}

export async function removeCategory(formData: FormData) {
  const session = await actor();
  const id = String(formData.get("id"));
  const used = await getDb().select({ id: products.id }).from(products).where(eq(products.categoryId, id)).limit(1);
  if (used.length) return go("/groups", "Move the pieces out of this group first.");
  await getDb().delete(categories).where(eq(categories.id, id));
  await audit(session.userId, "Removed a group", "category", id);
  refresh();
  return go("/groups", "Group removed.");
}

export async function saveCollection(formData: FormData) {
  const session = await actor();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  if (!name) return go("/groups", "Add a name for the collection.");
  const intro = String(formData.get("intro") ?? "").trim().slice(0, 500);
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const db = getDb();
  let collectionId = id;
  if (id) {
    await db.update(collections).set({ name, intro, imageUrl: imageUrl || null }).where(eq(collections.id, id));
  } else {
    collectionId = randomUUID();
    const slug = await unusedSlug(name, async (value) => {
      const [row] = await db.select({ id: collections.id }).from(collections).where(eq(collections.slug, value)).limit(1);
      return Boolean(row);
    });
    await db.insert(collections).values({ id: collectionId, name, slug, intro, imageUrl: imageUrl || null });
  }
  const picked = formData.getAll("productId").map(String).filter(Boolean);
  await db.delete(collectionProducts).where(eq(collectionProducts.collectionId, collectionId));
  if (picked.length) {
    await db.insert(collectionProducts).values(picked.map((productId, index) => ({ collectionId, productId, sortOrder: index })));
  }
  await audit(session.userId, "Saved a collection", "collection", collectionId);
  refresh();
  return go("/groups", "Collection saved.");
}

export async function removeCollection(formData: FormData) {
  const session = await actor();
  const id = String(formData.get("id"));
  const db = getDb();
  await db.delete(collectionProducts).where(eq(collectionProducts.collectionId, id));
  await db.delete(collections).where(eq(collections.id, id));
  await audit(session.userId, "Removed a collection", "collection", id);
  refresh();
  return go("/groups", "Collection removed.");
}

export async function saveHome(formData: FormData) {
  const session = await actor();
  const current = await readSettings();
  const hours = WEEKDAY_NAMES.map((day) => ({
    day,
    closed: formData.get(`closed-${day}`) === "on",
    open: String(formData.get(`open-${day}`) ?? "").slice(0, 5),
    close: String(formData.get(`close-${day}`) ?? "").slice(0, 5),
  })).filter((row) => row.closed || row.open || row.close);
  const questions = formData.getAll("faqQ").map(String);
  const answers = formData.getAll("faqA").map(String);
  const faqs = questions
    .map((question, index) => ({ q: question.trim(), a: (answers[index] ?? "").trim() }))
    .filter((item) => item.q && item.a)
    .slice(0, 12);
  const theme = String(formData.get("theme"));
  const fontPair = String(formData.get("fontPair"));
  const next: ShopSettings = {
    ...current,
    businessName: String(formData.get("businessName") ?? current.businessName).trim().slice(0, 80) || current.businessName,
    ownerName: String(formData.get("ownerName") ?? "").trim().slice(0, 80) || "Ajja",
    town: String(formData.get("town") ?? "").trim().slice(0, 80) || current.town,
    region: String(formData.get("region") ?? "").trim().slice(0, 80) || current.region,
    country: "United States",
    currency: "USD",
    locale: "en",
    whatsapp: String(formData.get("whatsapp") ?? "").trim().slice(0, 40),
    phone: String(formData.get("phone") ?? "").trim().slice(0, 40),
    email: String(formData.get("email") ?? "").trim().slice(0, 120),
    address: String(formData.get("address") ?? "").trim().slice(0, 160),
    mapUrl: String(formData.get("mapUrl") ?? "").trim().slice(0, 300) || defaultSettings.mapUrl,
    hours,
    announcement: String(formData.get("announcement") ?? "").trim().slice(0, 180),
    announcementLive: formData.get("announcementLive") === "on",
    heroHeadline: String(formData.get("heroHeadline") ?? "").trim().slice(0, 160) || current.heroHeadline,
    heroText: String(formData.get("heroText") ?? "").trim().slice(0, 500),
    heroImage: String(formData.get("heroImage") ?? "").trim(),
    heroFocalX: Math.min(1, Math.max(0, Number(formData.get("heroFocalX")) || 0.5)),
    heroFocalY: Math.min(1, Math.max(0, Number(formData.get("heroFocalY")) || 0.5)),
    story: String(formData.get("story") ?? "").trim().slice(0, 2000),
    ownerPhoto: String(formData.get("ownerPhoto") ?? "").trim(),
    paymentNote: String(formData.get("paymentNote") ?? "").trim().slice(0, 400),
    responseNote: String(formData.get("responseNote") ?? "").trim().slice(0, 400),
    whatsappChannel: String(formData.get("whatsappChannel") ?? "").trim().slice(0, 300),
    instagram: String(formData.get("instagram") ?? "").trim().slice(0, 300),
    facebook: String(formData.get("facebook") ?? "").trim().slice(0, 300),
    policies: {
      buying: String(formData.get("buying") ?? "").trim().slice(0, 1000),
      collection: String(formData.get("collection") ?? "").trim().slice(0, 1000),
      returns: String(formData.get("returns") ?? "").trim().slice(0, 1000),
    },
    faqs,
    theme: theme === "clay" || theme === "ink" ? theme : "walnut",
    fontPair: fontPair === "newsreader" ? "newsreader" : "fraunces",
    copyNeedsApproval: formData.get("approved") !== "on",
    checklist: current.checklist,
    lastBackupAt: current.lastBackupAt,
    enquiryRetentionDays: current.enquiryRetentionDays,
  };
  await writeSettings(next);
  await audit(session.userId, "Edited the home page", "settings", "shop");
  return go("/home", next.copyNeedsApproval ? "Saved. Needs your approval." : "Saved.");
}

export async function saveTestimonial(formData: FormData) {
  const session = await actor();
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const text = String(formData.get("text") ?? "").trim().slice(0, 1000);
  const consent = String(formData.get("consent") ?? "").trim().slice(0, 300);
  const id = String(formData.get("id") ?? "");
  if (!name || !text) return go("/home", "A quote needs a name and the words.");
  const status = formData.get("publish") === "on" && consent ? "published" : "draft";
  const note = formData.get("publish") === "on" && !consent ? "Saved as a draft. A quote needs a consent note before it can go on the site." : "Quote saved.";
  const db = getDb();
  if (id) {
    await db.update(testimonials).set({ name, text, consentNote: consent, status }).where(eq(testimonials.id, id));
  } else {
    await db.insert(testimonials).values({ name, text, consentNote: consent, status });
  }
  await audit(session.userId, "Saved a quote", "testimonial", id || name);
  refresh();
  return go("/home", note);
}

export async function removeTestimonial(formData: FormData) {
  const session = await actor();
  const id = String(formData.get("id"));
  await getDb().delete(testimonials).where(eq(testimonials.id, id));
  await audit(session.userId, "Removed a quote", "testimonial", id);
  refresh();
  return go("/home", "Quote removed.");
}

export async function setEnquiryStatus(formData: FormData) {
  const session = await actor();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["new", "replied", "closed"].includes(status)) return go("/messages", "Choose a status.");
  await getDb().update(enquiries).set({ status }).where(eq(enquiries.id, id));
  await audit(session.userId, "Updated a message", "enquiry", id, { status });
  return go("/messages", "Message updated.");
}

export async function saveRetention(formData: FormData) {
  const session = await actor();
  const days = Math.min(3650, Math.max(30, Number(formData.get("days")) || 365));
  const current = await readSettings();
  await writeSettings({ ...current, enquiryRetentionDays: days });
  await audit(session.userId, "Set how long messages are kept", "settings", "shop");
  return go("/messages", `Messages are kept for ${days} days.`);
}

export async function toggleChecklist(formData: FormData) {
  const session = await actor();
  const key = String(formData.get("key") ?? "").slice(0, 40);
  const current = await readSettings();
  await writeSettings({ ...current, checklist: { ...current.checklist, [key]: formData.get("done") === "on" } });
  await audit(session.userId, "Updated the checklist", "settings", "shop");
  return go("", "Checklist saved.");
}

export async function confirmImport(formData: FormData) {
  const session = await actor();
  const table = parseCsv(String(formData.get("csv") ?? ""));
  if (table.length < 2) return go("/files", "The file needs a header row and one piece.");
  const header = table[0].map((cell) => cell.trim().toLowerCase());
  const index = (name: string) => header.indexOf(name);
  const db = getDb();
  const groups = await db.select().from(categories);
  let updated = 0;
  const errors: string[] = [];
  for (const [rowIndex, row] of table.slice(1).entries()) {
    const cell = (name: string) => (index(name) >= 0 ? (row[index(name)] ?? "").trim() : "");
    const file = cell("filename") || cell("originalfile") || cell("file");
    const slug = cell("slug");
    if (!file && !slug) {
      errors.push(`Row ${rowIndex + 2}: add a filename or slug.`);
      continue;
    }
    const [match] = await db
      .select()
      .from(products)
      .where(file ? sql`${products.attributes}->>'originalFile' = ${file}` : eq(products.slug, slug))
      .limit(1);
    if (!match) {
      errors.push(`Row ${rowIndex + 2}: no piece matches ${file || slug}.`);
      continue;
    }
    const patch: Partial<typeof products.$inferInsert> = { updatedAt: new Date() };
    if (cell("title")) patch.title = cell("title").slice(0, 160);
    if (cell("price")) {
      const price = money(cell("price"));
      if (!price.ok) {
        errors.push(`Row ${rowIndex + 2}: ${price.message}`);
        continue;
      }
      patch.priceMinor = price.value;
    }
    if (cell("compare")) {
      const compare = money(cell("compare"));
      if (!compare.ok) {
        errors.push(`Row ${rowIndex + 2}: ${compare.message}`);
        continue;
      }
      patch.comparePriceMinor = compare.value;
    }
    if (cell("category")) {
      const group = groups.find((item) => item.name.toLowerCase() === cell("category").toLowerCase());
      if (!group) {
        errors.push(`Row ${rowIndex + 2}: no group named ${cell("category")}.`);
        continue;
      }
      patch.categoryId = group.id;
    }
    if (cell("condition")) patch.condition = cell("condition").slice(0, 40);
    if (cell("sku")) patch.sku = cell("sku").slice(0, 60);
    if (cell("tags")) patch.tags = cell("tags").split(",").map((tag) => tag.trim()).filter(Boolean);
    if (cell("status")) {
      const status = cell("status").toLowerCase();
      const allowed = ["draft", "scheduled", "published", "sold", "hidden", "on the site"];
      if (!allowed.includes(status)) {
        errors.push(`Row ${rowIndex + 2}: status should be Draft, Scheduled, On the site, Sold, or Hidden.`);
        continue;
      }
      patch.status = status === "on the site" ? "published" : status;
    }
    const attributes = { ...((match.attributes ?? {}) as Record<string, string>) };
    if (cell("size")) attributes.size = cell("size");
    if (cell("details")) attributes.details = cell("details");
    patch.attributes = attributes;
    if (cell("quantity")) {
      const quantity = Number(cell("quantity"));
      if (!Number.isInteger(quantity)) {
        errors.push(`Row ${rowIndex + 2}: quantity should be a whole number.`);
        continue;
      }
      patch.quantity = quantity;
    }
    await snapshot(match.id, "Brought in from a file", session.email);
    await db.update(products).set(patch).where(eq(products.id, match.id));
    updated += 1;
  }
  await audit(session.userId, "Brought in a file", "product", null, { updated: String(updated) });
  refresh();
  const errorNote = errors.slice(0, 5).join(" ");
  return go("/files", `${updated} pieces updated. ${errors.length} rows skipped. ${errorNote}`.trim());
}

