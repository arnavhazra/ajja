"use server";

import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { products } from "../db/schema";
import { pieceSchema } from "../schemas";
import { isProvisionalSlug } from "../piece-title";
import { parseNewYork } from "../time";
import { slugify } from "../slug";
import {
  audit,
  actor,
  go,
  money,
  publishGate,
  refresh,
  snapshot,
  uniqueSlug,
  writeSlugRedirect,
} from "./shared";

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
      // A blanked-out extra is removed, not kept as an empty string — otherwise
      // stale facts (like an old dimensions fallback) linger in the catalogue.
      if (value.trim()) attributes[key.slice(6)] = value.trim();
      else delete attributes[key.slice(6)];
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
