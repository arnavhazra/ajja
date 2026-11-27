"use server";

import { createHash, randomUUID } from "node:crypto";
import { del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { productImages, products } from "../db/schema";
import { assertBlobUrl, storeImage } from "../images";
import { pieceSlug } from "../slug";
import { audit, actor, refresh, snapshot } from "./shared";

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
