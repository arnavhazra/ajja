import { createHash } from "node:crypto";

export function dayHash(ip: string, userAgent: string, secret: string, day = new Date().toISOString().slice(0, 10)) {
  return createHash("sha256").update(`${day}|${ip}|${userAgent}|${secret}`).digest("hex").slice(0, 32);
}
