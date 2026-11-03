import "server-only";

import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { adminUsers, auditLog, loginCodes, sessions } from "./db/schema";
import { checkPassword, hashPassword } from "./password";
import { verifyTotp } from "./totp";

export const SESSION_COOKIE = "ajja_session";
const MONTH = 60 * 60 * 24 * 30;

function hashCode(code: string) {
  return createHash("sha256").update(`${code}:${process.env.SESSION_SECRET ?? ""}`).digest("hex");
}

function same(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function allowedEmails() {
  return [process.env.OWNER_EMAIL, process.env.DEV_ADMIN_EMAIL]
    .map((email) => email?.trim().toLowerCase())
    .filter((email): email is string => Boolean(email));
}

async function writeCookie(id: string, expires: Date) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function getSession() {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const db = getDb();
  const [session] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
  if (!session || session.expiresAt.getTime() < Date.now()) return null;
  if (session.expiresAt.getTime() - Date.now() < 25 * 24 * 60 * 60 * 1000) {
    const expiresAt = new Date(Date.now() + MONTH * 1000);
    await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, session.id));
    await writeCookie(session.id, expiresAt);
    return { ...session, expiresAt };
  }
  return session;
}

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("Please sign in again.");
  return session;
}

async function deviceLabel() {
  const header = await headers();
  return header.get("user-agent")?.slice(0, 120) ?? "This device";
}

async function startSession(email: string, role: string) {
  const db = getDb();
  const [user] = await db
    .insert(adminUsers)
    .values({ email, role })
    .onConflictDoUpdate({ target: adminUsers.email, set: { role } })
    .returning();
  const expiresAt = new Date(Date.now() + MONTH * 1000);
  const [session] = await db
    .insert(sessions)
    .values({ userId: user.id, email, role, expiresAt, deviceLabel: await deviceLabel() })
    .returning();
  await writeCookie(session.id, expiresAt);
  await db.insert(auditLog).values({
    userId: user.id,
    action: "Signed in",
    entity: "session",
    entityId: session.id,
    meta: { email },
  });
  return session;
}

export async function requestCode(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  const generic = "If this address is allowed, a code is on its way.";
  if (!allowedEmails().includes(email)) return { ok: true as const, message: generic };
  const db = getDb();
  const [latest] = await db.select().from(loginCodes).where(eq(loginCodes.email, email)).orderBy(desc(loginCodes.createdAt)).limit(1);
  if (latest?.lockedUntil && latest.lockedUntil.getTime() > Date.now()) {
    return { ok: true as const, message: generic };
  }
  const code = randomInt(0, 1000000).toString().padStart(6, "0");
  await db.insert(loginCodes).values({
    email,
    codeHash: hashCode(code),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  const sent = await sendCode(email, code);
  if (!sent && process.env.NODE_ENV !== "production") {
    console.info(`Sign-in code for ${email}: ${code}`);
  }
  return { ok: true as const, message: sent ? generic : "The shop cannot send a code yet. Use the staff door if you set the site up." };
}

export async function verifyCode(emailRaw: string, codeRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  const code = codeRaw.replace(/\s/g, "");
  if (!allowedEmails().includes(email)) return { ok: false as const, message: "That code did not work." };
  const db = getDb();
  const [row] = await db.select().from(loginCodes).where(eq(loginCodes.email, email)).orderBy(desc(loginCodes.createdAt)).limit(1);
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
    return { ok: false as const, message: "That code did not work." };
  }
  if (row.lockedUntil && row.lockedUntil.getTime() > Date.now()) {
    return { ok: false as const, message: "Too many tries. Wait 15 minutes." };
  }
  if (!same(row.codeHash, hashCode(code))) {
    const attempts = row.attempts + 1;
    await db
      .update(loginCodes)
      .set({
        attempts,
        lockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
      })
      .where(eq(loginCodes.id, row.id));
    return { ok: false as const, message: attempts >= 5 ? "Too many tries. Wait 15 minutes." : "That code did not work." };
  }
  await db.update(loginCodes).set({ usedAt: new Date() }).where(eq(loginCodes.id, row.id));
  await startSession(email, email === process.env.DEV_ADMIN_EMAIL?.toLowerCase() ? "developer" : "owner");
  return { ok: true as const, message: "Signed in." };
}

export async function verifyStaff(emailRaw: string, password: string, token: string) {
  const email = emailRaw.trim().toLowerCase();
  const expectedEmail = process.env.DEV_ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  const expectedPassword = process.env.DEV_ADMIN_PASSWORD ?? "";
  const secret = process.env.DEV_ADMIN_TOTP_SECRET ?? "";
  const emailOk = email.length > 0 && expectedEmail.length > 0 && same(email, expectedEmail);
  const passwordOk = password.length > 0 && expectedPassword.length > 0 && same(password, expectedPassword);
  const tokenOk = secret.length > 0 && verifyTotp(secret, token);
  if (!emailOk || !passwordOk || !tokenOk) {
    return { ok: false as const, message: "Those details did not work." };
  }
  await startSession(email, "developer");
  return { ok: true as const, message: "Signed in." };
}

const LOCK_AFTER = 5;
const LOCK_MINUTES = 15;
let decoyHash: Promise<string> | null = null;

/** Email + password from the admin_users table. Locks the account for 15 minutes after 5 wrong tries. */
export async function verifyPassword(emailRaw: string, password: string) {
  const email = emailRaw.trim().toLowerCase();
  const fail = { ok: false as const, message: "That email and password did not match." };
  const db = getDb();
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  if (!user?.passwordHash) {
    decoyHash ??= hashPassword("decoy-password");
    await checkPassword(password, await decoyHash);
    return fail;
  }
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    return { ok: false as const, message: `Too many tries. Wait ${LOCK_MINUTES} minutes.` };
  }
  if (!(await checkPassword(password, user.passwordHash))) {
    const attempts = user.failedAttempts + 1;
    const locked = attempts >= LOCK_AFTER;
    await db
      .update(adminUsers)
      .set({ failedAttempts: locked ? 0 : attempts, lockedUntil: locked ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : null })
      .where(eq(adminUsers.id, user.id));
    return locked ? { ok: false as const, message: `Too many tries. Wait ${LOCK_MINUTES} minutes.` } : fail;
  }
  await db.update(adminUsers).set({ failedAttempts: 0, lockedUntil: null }).where(eq(adminUsers.id, user.id));
  await startSession(email, user.role);
  return { ok: true as const, message: "Signed in." };
}

export async function changePassword(userId: string, current: string, next: string) {
  const db = getDb();
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, userId)).limit(1);
  if (!user) return { ok: false as const, message: "Please sign in again." };
  if (user.passwordHash && !(await checkPassword(current, user.passwordHash))) {
    return { ok: false as const, message: "Your current password did not match." };
  }
  await db
    .update(adminUsers)
    .set({ passwordHash: await hashPassword(next), passwordChangedAt: new Date(), failedAttempts: 0, lockedUntil: null })
    .where(eq(adminUsers.id, user.id));
  await db.insert(auditLog).values({ userId: user.id, action: "Changed password", entity: "admin_user", entityId: user.id, meta: {} });
  return { ok: true as const, message: "Password changed." };
}

export async function signOut() {
  const session = await getSession();
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  if (session) {
    const db = getDb();
    await db.delete(sessions).where(eq(sessions.id, session.id));
    await db.insert(auditLog).values({
      userId: session.userId,
      action: "Signed out",
      entity: "session",
      entityId: session.id,
      meta: {},
    });
  }
}

async function sendCode(email: string, code: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Your Ajja sign-in code",
      text: `Your code is ${code}. It lasts 10 minutes.`,
    }),
  });
  return response.ok;
}
