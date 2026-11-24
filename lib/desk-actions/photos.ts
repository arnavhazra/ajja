"use server";

import sharp from "sharp";
import { and, asc, eq } from "drizzle-orm";
import { after } from "next/server";
import { z } from "zod";
import { dropBlobIfUnused } from "../blob-retention";
import { getDb } from "../db";
import { categories, productImages, products } from "../db/schema";
import { enhanceKind, enhancePhoto, shouldEnhance } from "../enhance";
import { storeImage } from "../images";
import { type ShopSettings } from "../settings";
import { actor, audit, go, readSettings, refresh, snapshot, writeSettings } from "./shared";

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

/** Auto-tidy a newly uploaded photo: one OpenRouter generation, set as cover.
 *  Idempotent via attributes.enhance[imageId]. Skips silently without a key. */
async function enhanceUploadedPhoto(productId: string, imageId: string, imageUrl: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return;
  const db = getDb();
  const mark = async (status: string, extra: Record<string, unknown> = {}) => {
    const [p] = await db.select({ attributes: products.attributes }).from(products).where(eq(products.id, productId)).limit(1);
    const attrs = (p?.attributes ?? {}) as unknown as Record<string, unknown>;
    const enhance = { ...((attrs.enhance as unknown as Record<string, unknown>) ?? {}) };
    enhance[imageId] = { status, ...extra };
    await db.update(products).set({ attributes: { ...attrs, enhance } as unknown as Record<string, string> }).where(eq(products.id, productId));
  };
  // Idempotency: only one generation per photo, ever.
  const [existing] = await db.select({ attributes: products.attributes }).from(products).where(eq(products.id, productId)).limit(1);
  const enhanceMap = (existing?.attributes?.enhance as unknown as Record<string, { status?: string }>) ?? {};
  if (!shouldEnhance(enhanceMap, imageId)) return;
  await mark("pending", {});
  try {
    const [info] = await db
      .select({ category: categories.name, attributes: products.attributes })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, productId))
      .limit(1);
    const kind = enhanceKind(info?.category, info?.attributes as unknown as Record<string, unknown>);
    const gen = await enhancePhoto({ apiKey, imageUrl, kind });
    const stored = await storeImage(Buffer.from(gen.bytes), "pieces/enhanced.webp");
    const images = await db.select().from(productImages).where(eq(productImages.productId, productId)).orderBy(asc(productImages.sortOrder));
    const [ins] = await db
      .insert(productImages)
      .values({ productId, url: stored.url, width: stored.width, height: stored.height, blurData: stored.blurData, alt: "enhanced-version", sortOrder: images.length })
      .returning({ id: productImages.id });
    const [p] = await db.select({ attributes: products.attributes }).from(products).where(eq(products.id, productId)).limit(1);
    const attrs = (p?.attributes ?? {}) as unknown as Record<string, unknown>;
    const versions = { ...((attrs.enhancedVersions as unknown as Record<string, string>) ?? {}) };
    versions[imageId] = ins.id;
    await db.update(products).set({ attributes: { ...attrs, enhancedVersions: versions } as unknown as Record<string, string> }).where(eq(products.id, productId));
    let order = 1;
    const fresh = await db.select().from(productImages).where(eq(productImages.productId, productId)).orderBy(asc(productImages.sortOrder));
    for (const item of fresh) {
      await db.update(productImages).set({ sortOrder: item.id === ins.id ? 0 : order++ }).where(eq(productImages.id, item.id));
    }
    await mark("done", { model: gen.model, cost: gen.usage?.cost ?? null });
  } catch {
    await mark("failed", {});
  }
}

/** Manual retry — the only path to a second generation for a photo. */
export async function retryEnhance(formData: FormData) {
  const session = await actor();
  const parsed = z.object({ imageId: z.string().uuid(), productId: z.string().uuid() }).safeParse({
    imageId: String(formData.get("imageId") ?? ""),
    productId: String(formData.get("productId") ?? ""),
  });
  if (!parsed.success) return go("/pieces", "That photo is not here.");
  const db = getDb();
  const [image] = await db.select().from(productImages).where(eq(productImages.id, parsed.data.imageId)).limit(1);
  if (!image) return go("/pieces", "That photo is not here.");
  const [p] = await db.select({ attributes: products.attributes }).from(products).where(eq(products.id, parsed.data.productId)).limit(1);
  const attrs = (p?.attributes ?? {}) as unknown as Record<string, unknown>;
  const enhance = { ...((attrs.enhance as unknown as Record<string, unknown>) ?? {}) };
  delete enhance[parsed.data.imageId];
  await db.update(products).set({ attributes: { ...attrs, enhance } as unknown as Record<string, string> }).where(eq(products.id, parsed.data.productId));
  await audit(session.userId, "Retried photo tidy", "product", parsed.data.productId);
  after(() => enhanceUploadedPhoto(parsed.data.productId, parsed.data.imageId, image.url));
  return go(`/pieces/${parsed.data.productId}`, "Tidying photo…");
}

/** Set every enhanced version as its piece's cover — the approved catalogue sweep. */
export async function approveEnhancedCovers() {
  const session = await actor();
  const db = getDb();
  const rows = await db.select({ id: products.id, attributes: products.attributes }).from(products);
  let applied = 0;
  for (const row of rows) {
    const versions = (((row.attributes ?? {}) as unknown as Record<string, unknown>).enhancedVersions ?? {}) as Record<string, string>;
    for (const enhancedId of Object.values(versions)) {
      const images = await db.select().from(productImages).where(eq(productImages.productId, row.id)).orderBy(asc(productImages.sortOrder));
      if (!images.some((i) => i.id === enhancedId)) continue;
      let order = 1;
      for (const item of images) {
        await db.update(productImages).set({ sortOrder: item.id === enhancedId ? 0 : order++ }).where(eq(productImages.id, item.id));
      }
      await audit(session.userId, "Chose the cover photo", "product", row.id);
      applied += 1;
    }
  }
  refresh();
  return go("/settings", `Enhanced cover set on ${applied} pieces.`);
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

  const [owner] = await db.select().from(products).where(eq(products.id, image.productId)).limit(1);
  if (!owner || owner.deletedAt || owner.status !== "published") {
    const target = productId ? `/pieces/${productId}` : `/pieces/${image.productId}`;
    return go(target, "Put this piece on the site first before making it the homepage photo.");
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
  await actor();
  const parsed = z.object({ imageId: z.string().uuid() }).safeParse({ imageId: String(formData.get("imageId") ?? "") });
  if (!parsed.success) return go("/pieces", "That photo is not here.");
  const imageId = parsed.data.imageId;
  const [image] = await getDb().select().from(productImages).where(eq(productImages.id, imageId)).limit(1);
  if (!image) return go("/pieces", "That photo is not here.");
  const response = await fetch(image.url);
  const input = Buffer.from(await response.arrayBuffer());
  const turned = await sharp(input).rotate(90).toBuffer();
  return replaceImage(imageId, turned, "Turned a photo");
}

export async function cropImage(formData: FormData) {
  await actor();
  const parsed = z.object({ imageId: z.string().uuid() }).safeParse({ imageId: String(formData.get("imageId") ?? "") });
  if (!parsed.success) return go("/pieces", "That photo is not here.");
  const imageId = parsed.data.imageId;
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
  // Reorder only inside the sortOrder slots the submitted images already hold.
  // Images outside the submitted set (e.g. an enhanced cover at sortOrder 0)
  // keep their position instead of colliding with a freshly numbered 0..n.
  const rows = await db
    .select({ id: productImages.id, sortOrder: productImages.sortOrder })
    .from(productImages)
    .where(eq(productImages.productId, productId));
  const submitted = new Set(orderedIds);
  const slots = rows
    .filter((row) => submitted.has(row.id))
    .map((row) => row.sortOrder)
    .sort((a, b) => a - b);
  const fallback = Math.max(-1, ...rows.map((row) => row.sortOrder)) + 1;
  for (const [index, id] of orderedIds.entries()) {
    const sortOrder = slots[index] ?? fallback + index;
    await db.update(productImages).set({ sortOrder }).where(and(eq(productImages.id, id), eq(productImages.productId, productId)));
  }
  await audit(session.userId, "Reordered photos", "product", productId);
  refresh();
  return { ok: true as const, message: "Order saved." };
}
