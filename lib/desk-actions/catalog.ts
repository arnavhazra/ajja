"use server";

import { randomUUID } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { categories, collectionProducts, collections, products } from "../db/schema";
import { slugify } from "../slug";
import { actor, audit, go, refresh, unusedSlug } from "./shared";

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

export async function moveCategory(direction: string, formData: FormData) {
  const session = await actor();
  const id = String(formData.get("id"));
  const dir = direction === "up" ? -1 : 1;
  const db = getDb();
  const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder));
  const index = rows.findIndex((row) => row.id === id);
  const swap = rows[index + dir];
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
  const db = getDb();
  const [category] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!category) return go("/groups", "That group is not here.");
  const members = await db.select({ id: products.id }).from(products).where(eq(products.categoryId, id));
  const undoId = await audit(session.userId, "Removed a group", "category", id, {
    kind: "category",
    snapshot: category,
    memberIds: members.map((member) => member.id),
  });
  if (members.length) {
    await db.update(products).set({ categoryId: null, updatedAt: new Date() }).where(eq(products.categoryId, id));
  }
  await db.delete(categories).where(eq(categories.id, id));
  refresh();
  const moved = members.length === 1 ? " 1 piece moved out of it." : members.length > 1 ? ` ${members.length} pieces moved out of it.` : "";
  return go("/groups", `Group removed.${moved}`, undoId);
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
  const [collection] = await db.select().from(collections).where(eq(collections.id, id)).limit(1);
  if (!collection) return go("/groups", "That collection is not here.");
  const links = await db.select().from(collectionProducts).where(eq(collectionProducts.collectionId, id));
  const undoId = await audit(session.userId, "Removed a collection", "collection", id, {
    kind: "collection",
    snapshot: collection,
    links,
  });
  await db.delete(collectionProducts).where(eq(collectionProducts.collectionId, id));
  await db.delete(collections).where(eq(collections.id, id));
  refresh();
  return go("/groups", "Collection removed.", undoId);
}
