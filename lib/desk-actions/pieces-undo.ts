"use server";

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
import { audit, actor, go, refresh, type Snapshot } from "./shared";

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
