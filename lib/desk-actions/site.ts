"use server";

import { eq, inArray, sql } from "drizzle-orm";
import { parseCsv } from "../csv";
import { getDb } from "../db";
import { categories, enquiries, products, testimonials } from "../db/schema";
import { WEEKDAY_NAMES } from "../open-now";
import { defaultSettings, type ShopSettings } from "../settings";
import { actor, audit, go, money, publishGate, readSettings, refresh, snapshot, writeSettings } from "./shared";

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
    leadTime: String(formData.get("leadTime") ?? "").trim().slice(0, 1000),
    holds: String(formData.get("holds") ?? "").trim().slice(0, 1000),
    commissions: String(formData.get("commissions") ?? "").trim().slice(0, 1000),
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

/** Bulk mark several messages at once — checkboxes post every checked id. */
export async function markEnquiries(formData: FormData) {
  const session = await actor();
  const ids = formData.getAll("id").map(String).filter(Boolean).slice(0, 200);
  const status = String(formData.get("status"));
  if (!["new", "replied", "closed"].includes(status)) return go("/messages", "Choose a status.");
  if (!ids.length) return go("/messages", "Nothing was ticked.");
  await getDb().update(enquiries).set({ status }).where(inArray(enquiries.id, ids));
  await audit(session.userId, "Updated messages", "enquiry", ids.join(","), { status, count: ids.length });
  return go("/messages", `${ids.length} messages updated.`);
}

export async function saveRetention(formData: FormData) {
  const session = await actor();
  const days = Math.min(3650, Math.max(30, Number(formData.get("days")) || 365));
  const current = await readSettings();
  await writeSettings({ ...current, enquiryRetentionDays: days });
  await audit(session.userId, "Set how long messages are kept", "settings", "shop");
  return go("/messages", `Messages are kept for ${days} days.`);
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
    if (patch.status === "published" || patch.status === "scheduled" || patch.status === "sold") {
      const gate = await publishGate({ id: match.id, title: patch.title ?? match.title, deletedAt: match.deletedAt });
      if (!gate.ok) {
        errors.push(`Row ${rowIndex + 2}: ${gate.reason}`);
        continue;
      }
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
