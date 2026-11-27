"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { productImages, products } from "../db/schema";
import { pieceSlug } from "../slug";
import { audit, actor, backTo, go, publishGate, refresh, snapshot } from "./shared";

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
