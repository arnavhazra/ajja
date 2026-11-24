"use server";

import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb } from "../db";
import { categories, productImages, products } from "../db/schema";
import { isProvisionalSlug } from "../piece-title";
import { aboutPieceSchema, inlineEditSchema } from "../schemas";
import {
  actor,
  audit,
  go,
  money,
  publishGate,
  refresh,
  snapshot,
  uniqueSlug,
  writeSlugRedirect,
} from "./shared";

export async function saveInlineField(input: { id: string; intent: string; value: string }) {
  "use server";
  const session = await actor();
  const parsed = inlineEditSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: "Check this field.", undoId: "" };
  const { id, intent, value } = parsed.data;
  const db = getDb();
  const [current] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!current) return { ok: false as const, message: "That piece is not here.", undoId: "" };
  const undoId = await snapshot(id, "Quick edit", session.email);
  if (intent === "title") {
    let slug = current.slug;
    if (value && isProvisionalSlug(current.slug)) {
      const nextSlug = await uniqueSlug(value, current.id);
      if (nextSlug !== current.slug) {
        await writeSlugRedirect(current.slug, nextSlug);
        slug = nextSlug;
      }
    }
    await db.update(products).set({ title: value, slug, updatedAt: new Date() }).where(eq(products.id, id));
  } else if (intent === "price") {
    const price = money(value);
    if (!price.ok) return { ok: false as const, message: price.message, undoId: "" };
    await db.update(products).set({ priceMinor: price.value, updatedAt: new Date() }).where(eq(products.id, id));
  } else if (intent === "status") {
    if (!["draft", "scheduled", "published", "sold", "hidden"].includes(value)) {
      return { ok: false as const, message: "Choose a status.", undoId: "" };
    }
    if (value === "published" || value === "scheduled" || value === "sold") {
      const gate = await publishGate(current);
      if (!gate.ok) return { ok: false as const, message: gate.reason, undoId: "" };
    }
    await db.update(products).set({ status: value, updatedAt: new Date() }).where(eq(products.id, id));
  } else if (intent === "category") {
    if (value) {
      const [group] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, value)).limit(1);
      if (!group) return { ok: false as const, message: "That group is not here.", undoId: "" };
    }
    await db.update(products).set({ categoryId: value || null, updatedAt: new Date() }).where(eq(products.id, id));
  }
  await audit(session.userId, "Quick edit", "product", id);
  refresh();
  return { ok: true as const, message: "Saved.", undoId };
}

/**
 * The "About this piece" stage of the add flow. Writes only the fields that
 * stage owns — photo, status, and every other column stay exactly as they are.
 */
export async function saveAboutPiece(input: { id: string; title: string; categoryId: string; description: string; price: string }) {
  "use server";
  const session = await actor();
  const parsed = aboutPieceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check this piece.", field: "" };
  }
  const price = money(parsed.data.price);
  if (!price.ok) return { ok: false as const, message: price.message, field: "price" };
  const db = getDb();
  const [current] = await db.select().from(products).where(eq(products.id, parsed.data.id)).limit(1);
  if (!current || current.deletedAt) return { ok: false as const, message: "That piece is not here.", field: "" };
  if (parsed.data.categoryId) {
    const [group] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, parsed.data.categoryId)).limit(1);
    if (!group) return { ok: false as const, message: "That art form is not here.", field: "categoryId" };
  }
  const undoId = await snapshot(current.id, "About this piece", session.email);
  let slug = current.slug;
  const title = parsed.data.title.trim();
  // Only provisional slugs (piece-*) are replaced — an established slug never
  // moves on rename, so saved links stay put without needing a redirect.
  if (title && isProvisionalSlug(current.slug)) {
    const nextSlug = await uniqueSlug(title, current.id);
    if (nextSlug !== current.slug) {
      await writeSlugRedirect(current.slug, nextSlug);
      slug = nextSlug;
    }
  }
  await db
    .update(products)
    .set({
      title,
      slug,
      categoryId: parsed.data.categoryId || null,
      description: parsed.data.description,
      priceMinor: price.value,
      updatedAt: new Date(),
    })
    .where(eq(products.id, current.id));
  await audit(session.userId, "About this piece", "product", current.id);
  refresh();
  return { ok: true as const, message: "Saved.", field: "", undoId };
}

export async function sprintSave(formData: FormData) {
  const session = await actor();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  const price = money(String(formData.get("price") ?? ""));
  if (!price.ok) return go(`/review`, price.message);
  const db = getDb();
  const [current] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!current) return go("/review", "That piece is not here.");
  const undoId = await snapshot(id, "Sprint edit", session.email);
  let slug = current.slug;
  if (title && isProvisionalSlug(current.slug)) {
    const nextSlug = await uniqueSlug(title, current.id);
    if (nextSlug !== current.slug) {
      await writeSlugRedirect(current.slug, nextSlug);
      slug = nextSlug;
    }
  }
  await db
    .update(products)
    .set({ title, priceMinor: price.value, slug, updatedAt: new Date() })
    .where(eq(products.id, id));
  await audit(session.userId, "Sprint edit", "product", id);
  refresh();
  return go(`/review?skip=${id}`, "Saved.", undoId);
}

export async function toggleFeatured(formData: FormData) {
  const session = await actor();
  const id = String(formData.get("id"));
  const db = getDb();
  const [row] = await db.select({ featured: products.featured }).from(products).where(eq(products.id, id)).limit(1);
  if (!row) return go("/pieces", "That piece is not here.");
  await db.update(products).set({ featured: !row.featured, updatedAt: new Date() }).where(eq(products.id, id));
  await audit(session.userId, row.featured ? "Unfeatured a piece" : "Featured a piece", "product", id);
  refresh();
  return go("/pieces", row.featured ? "No longer featured." : "Featured.");
}

/** Permanently remove trash older than 30 days. */
export async function emptyTrash() {
  const session = await actor();
  const db = getDb();
  const old = await db
    .select({ id: products.id })
    .from(products)
    .where(sql`${products.deletedAt} is not null and ${products.deletedAt} < now() - interval '30 days'`);
  if (old.length === 0) return go("/pieces?trash=1", "Nothing in the trash is older than 30 days.");
  await db.delete(productImages).where(inArray(productImages.productId, old.map((r) => r.id)));
  await db.delete(products).where(inArray(products.id, old.map((r) => r.id)));
  await audit(session.userId, "Emptied the trash", "product", old.length.toString());
  refresh();
  return go("/pieces?trash=1", `${old.length} pieces removed for good.`);
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
  const undoIds: string[] = [];
  for (const id of ids) {
    if (action === "publish" || action === "sold") {
      const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
      const gate = product ? await publishGate(product) : { ok: false as const, reason: "not found" };
      if (!gate.ok) {
        skipped += 1;
        continue;
      }
    }
    const undoId = await snapshot(id, "Bulk change", session.email);
    if (undoId) undoIds.push(undoId);
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
  const skippedNote = skipped
    ? action === "publish" || action === "sold"
      ? ` ${skipped} needed a photo or name first.`
      : ` ${skipped} had no price, so they were left alone.`
    : "";
  return go("/pieces", `${changed} updated.${skippedNote}`, undoIds.length ? undoIds.join(",") : undefined);
}
