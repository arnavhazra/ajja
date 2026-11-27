"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { enquirySchema } from "./schemas";
import { getDb } from "./db";
import { auditLog, enquiries, products } from "./db/schema";
import { allowRate } from "./rate-limit";
import { dayHash } from "./day-hash";
import { getSettings } from "./public-data";
import { clientIp } from "./request-ip";

export async function sendEnquiry(_state: { ok: boolean; message: string }, formData: FormData) {
  const quantity = String(formData.get("quantity") ?? "").trim();
  const parsed = enquirySchema.safeParse({
    name: formData.get("name"),
    contact: formData.get("contact"),
    subject: formData.get("subject") ?? "",
    message: formData.get("message"),
    giftNote: formData.get("giftNote") ?? "",
    quantity: quantity || undefined,
    bulk: formData.get("bulk") === "on",
    productId: String(formData.get("productId") ?? ""),
    company: String(formData.get("company") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }
  if (parsed.data.company) return { ok: true, message: "Message saved. The studio will read it." };
  const headerList = await headers();
  const ip = clientIp(headerList);
  const hash = dayHash(ip, headerList.get("user-agent") ?? "", process.env.SESSION_SECRET ?? "ajja");
  const allowed = await allowRate(`enquiry:${hash}`, 5, 60 * 60);
  if (!allowed) return { ok: false, message: "Too many messages from this device. Try again later." };
  // Keep the product link only when the piece is publicly listed — a hidden,
  // trashed, or made-up id must not attach a private piece to an enquiry.
  let productId = parsed.data.productId && parsed.data.productId.length > 10 ? parsed.data.productId : null;
  const message = parsed.data.subject ? `${parsed.data.subject}\n\n${parsed.data.message}` : parsed.data.message;
  const db = getDb();
  if (productId) {
    const [row] = await db
      .select({ id: products.id })
      .from(products)
      .where(
        and(
          eq(products.id, productId),
          isNull(products.deletedAt),
          sql`(
            ${products.status} in ('published', 'sold')
            or (${products.status} = 'scheduled' and ${products.publishAt} is not null and ${products.publishAt} <= now())
          )`,
        ),
      )
      .limit(1);
    if (!row) productId = null;
  }
  await db.insert(enquiries).values({
    productId,
    name: parsed.data.name,
    contact: parsed.data.contact,
    message,
    giftNote: parsed.data.giftNote,
    quantity: parsed.data.quantity,
    bulk: parsed.data.bulk,
  });
  await db.insert(auditLog).values({ action: "New message", entity: "enquiry", entityId: productId, meta: {} });
  try {
    await notifyOwner(parsed.data.name, parsed.data.contact, parsed.data.message);
  } catch (error) {
    console.error("Owner email notification failed", error instanceof Error ? error.message : "unknown");
  }
  return { ok: true, message: "Message saved. The studio will read it." };
}

async function notifyOwner(name: string, contact: string, message: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return;
  const settings = await getSettings();
  const to = settings.email || process.env.OWNER_EMAIL;
  if (!to) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(5000),
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      subject: `New message from ${name}`,
      text: `${name}\n${contact}\n\n${message}`,
    }),
  });
}
