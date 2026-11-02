"use server";

import { headers } from "next/headers";
import { enquirySchema } from "./schemas";
import { getDb } from "./db";
import { auditLog, enquiries } from "./db/schema";
import { allowRate } from "./rate-limit";
import { dayHash } from "./day-hash";
import { getSettings } from "./public-data";

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
  if (parsed.data.company) return { ok: true, message: "Message saved. Ajja will read it." };
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0";
  const hash = dayHash(ip, headerList.get("user-agent") ?? "", process.env.SESSION_SECRET ?? "ajja");
  const allowed = await allowRate(`enquiry:${hash}`, 5, 60 * 60);
  if (!allowed) return { ok: false, message: "Too many messages from this device. Try again later." };
  const productId = parsed.data.productId && parsed.data.productId.length > 10 ? parsed.data.productId : null;
  const message = parsed.data.subject ? `${parsed.data.subject}\n\n${parsed.data.message}` : parsed.data.message;
  const db = getDb();
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
  await notifyOwner(parsed.data.name, parsed.data.contact, parsed.data.message);
  return { ok: true, message: "Message saved. Ajja will read it." };
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
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      subject: `New message from ${name}`,
      text: `${name}\n${contact}\n\n${message}`,
    }),
  });
}
