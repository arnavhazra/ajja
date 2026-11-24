"use server";

import { redirect } from "next/navigation";
import { changePassword, requestCode, requireSession, signOut, verifyCode, verifyPassword, verifyStaff } from "../auth";
import { deskPrefix } from "../desk-path";
import { passwordChangeSchema, passwordSignInSchema } from "../schemas";
import { go } from "./shared";

export async function sendSignInCode(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const result = await requestCode(email);
  const query = `/?code=1${email ? `&email=${encodeURIComponent(email)}` : ""}`;
  return go(query, result.message);
}

export async function completeSignIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const result = await verifyCode(email, String(formData.get("code") ?? ""));
  if (!result.ok) {
    const query = `/?code=1${email ? `&email=${encodeURIComponent(email)}` : ""}`;
    return go(query, result.message);
  }
  const prefix = await deskPrefix();
  redirect(prefix || "/");
}

export async function completePasswordSignIn(formData: FormData) {
  const parsed = passwordSignInSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return go("", parsed.error.issues[0]?.message ?? "Those details did not work.");
  const result = await verifyPassword(parsed.data.email, parsed.data.password);
  if (!result.ok) return go("", result.message);
  const prefix = await deskPrefix();
  redirect(prefix || "/");
}

export async function updatePassword(formData: FormData) {
  const session = await requireSession();
  const parsed = passwordChangeSchema.safeParse({
    current: formData.get("current") ?? "",
    next: formData.get("next"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return go("/account", parsed.error.issues[0]?.message ?? "That password did not work.");
  if (!session.userId) return go("/account", "Please sign in again.");
  const result = await changePassword(session.userId, parsed.data.current, parsed.data.next);
  return go("/account", result.message);
}

export async function completeStaffSignIn(formData: FormData) {
  const result = await verifyStaff(
    String(formData.get("email") ?? ""),
    String(formData.get("password") ?? ""),
    String(formData.get("token") ?? ""),
  );
  if (!result.ok) return go("/?staff=1", result.message);
  const prefix = await deskPrefix();
  redirect(prefix || "/");
}

export async function leaveDesk() {
  await signOut();
  const prefix = await deskPrefix();
  redirect(prefix || "/");
}
