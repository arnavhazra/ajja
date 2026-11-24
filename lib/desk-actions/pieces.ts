"use server";

import { createHash, randomUUID } from "node:crypto";
import { del } from "@vercel/blob";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "../db";
import {
  auditLog,
  categories,
  collectionProducts,
  collections,
  productImages,
  products,
  productVersions,
} from "../db/schema";
import { assertBlobUrl, storeImage } from "../images";
import { pieceSchema } from "../schemas";
import { isProvisionalSlug } from "../piece-title";
import { parseNewYork } from "../time";
import { pieceSlug, slugify } from "../slug";
import {
  audit,
  actor,
  backTo,
  go,
  money,
  publishGate,
  refresh,
  snapshot,
  type Snapshot,
  uniqueSlug,
  writeSlugRedirect,
} from "./shared";

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
    await db
      .insert(productImages)
      .values({
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
  if (parsed.data.status === "published" || parsed.data.status === "scheduled") {
    const gate = await publishGate({ id: current.id, title: parsed.data.title, deletedAt: current.deletedAt });
    if (!gate.ok) return go(`/pieces/${id}`, gate.reason);
  }
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
  if (parsed.data.title.trim() && isProvisionalSlug(current.slug)) {
    const nextSlug = await uniqueSlug(parsed.data.title, current.id);
    if (nextSlug !== current.slug) {
      await writeSlugRedirect(current.slug, nextSlug);
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
async function setStatus(id: string, status: "published" | "sold" | "hidden" | "draft", label: string, back?: string) {
  const session = await actor();
  const target = back && back.startsWith("/") ? back : `/pieces/${id}`;
  if (status === "published" || status === "sold") {
    const db = getDb();
    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!product) return go("/pieces", "That piece is not here.");
    const gate = await publishGate(product);
    if (!gate.ok) return go(target, gate.reason);
  }
  const undoId = await snapshot(id, label, session.email);
  await getDb().update(products).set({ status, updatedAt: new Date() }).where(eq(products.id, id));
  await audit(session.userId, label, "product", id);
  refresh();
  return go(target, label, undoId);
}

export async function publishPiece(formData: FormData) {
  return setStatus(String(formData.get("id")), "published", "Put on the site", backTo(formData));
}

export async function sellPiece(formData: FormData) {
  return setStatus(String(formData.get("id")), "sold", "Marked sold", backTo(formData));
}

export async function hidePiece(formData: FormData) {
  return setStatus(String(formData.get("id")), "hidden", "Hidden", backTo(formData));
}

export async function draftPiece(formData: FormData) {
  return setStatus(String(formData.get("id")), "draft", "Moved back to draft", backTo(formData));
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
  await getDb().update(products).set({ deletedAt: null, status: "draft", updatedAt: new Date() }).where(eq(products.id, id));
  await audit(session.userId, "Restored from trash", "product", id);
  refresh();
  return go(`/pieces/${id}`, "Restored as a private draft.", undoId);
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
  const ids = String(formData.get("id") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const back = String(formData.get("back") ?? "/pieces");
  let restored = 0;
  let lastProductId = "";
  for (const id of ids) {
    const productId = await restoreVersion(id);
    if (productId) {
      restored += 1;
      lastProductId = productId;
      await audit(session.userId, "Undid a change", "product", productId);
      continue;
    }
    const entity = await restoreRemoved(id);
    if (entity) {
      restored += 1;
      await audit(session.userId, "Undid a change", entity, id);
    }
  }
  if (!restored) return go(back.startsWith("/") ? back : "/pieces", "Nothing to undo.");
  refresh();
  const path = back.startsWith("/") ? back : `/pieces/${lastProductId}`;
  return go(path, restored === 1 ? "Change undone." : `${restored} changes undone.`);
}
async function restoreVersion(versionId: string) {
  const db = getDb();
  const [version] = await db.select().from(productVersions).where(eq(productVersions.id, versionId)).limit(1);
  // An already-used undo token can never replay to clobber newer edits.
  if (!version?.productId || version.undoneAt) return "";
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
  return version.productId;
}

// Bring back a removed group or collection from the snapshot kept in its audit row.
async function restoreRemoved(auditId: string) {
  const db = getDb();
  const [row] = await db.select().from(auditLog).where(eq(auditLog.id, auditId)).limit(1);
  const meta = (row?.meta ?? {}) as {
    kind?: string;
    snapshot?: Record<string, unknown>;
    memberIds?: string[];
    links?: { productId: string; sortOrder: number }[];
    restoredAt?: string;
  };
  if (!row || !meta.snapshot || meta.restoredAt) return "";
  if (meta.kind === "category") {
    const snap = meta.snapshot as unknown as typeof categories.$inferSelect;
    await db
      .insert(categories)
      .values({ ...snap, createdAt: new Date(snap.createdAt) })
      .onConflictDoNothing();
    if (meta.memberIds?.length) {
      await db
        .update(products)
        .set({ categoryId: snap.id, updatedAt: new Date() })
        .where(and(inArray(products.id, meta.memberIds), isNull(products.categoryId)));
    }
  } else if (meta.kind === "collection") {
    const snap = meta.snapshot as unknown as typeof collections.$inferSelect;
    await db
      .insert(collections)
      .values({ ...snap, createdAt: new Date(snap.createdAt) })
      .onConflictDoNothing();
    await db.delete(collectionProducts).where(eq(collectionProducts.collectionId, snap.id));
    if (meta.links?.length) {
      await db.insert(collectionProducts).values(
        meta.links.map((link) => ({ collectionId: snap.id, productId: link.productId, sortOrder: link.sortOrder })),
      );
    }
  } else {
    return "";
  }
  await db
    .update(auditLog)
    .set({ meta: { ...meta, restoredAt: new Date().toISOString() } })
    .where(eq(auditLog.id, auditId));
  return meta.kind;
}
export async function undoInline(versionId: string) {
  "use server";
  const session = await actor();
  const productId = await restoreVersion(versionId);
  if (!productId) return { ok: false as const, message: "Nothing to undo." };
  await audit(session.userId, "Undid a change", "product", productId);
  refresh();
  return { ok: true as const, message: "Change undone." };
}

/** Name & price sprint — save the two fields and carry on to the next draft. */
