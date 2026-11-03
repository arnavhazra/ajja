import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const COST = 16384;
const BLOCK = 8;
const PARALLEL = 1;

function derive(password: string, salt: Buffer, cost: number, block: number, parallel: number) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, { N: cost, r: block, p: parallel, maxmem: 64 * 1024 * 1024 }, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

/** Stored as `scrypt$N$r$p$salt$hash` so the cost can be raised later without breaking old passwords. */
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt, COST, BLOCK, PARALLEL);
  return ["scrypt", COST, BLOCK, PARALLEL, salt.toString("base64url"), key.toString("base64url")].join("$");
}

export async function checkPassword(password: string, stored: string) {
  const [scheme, cost, block, parallel, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const key = await derive(password, Buffer.from(salt, "base64url"), Number(cost), Number(block), Number(parallel));
  return key.length === expected.length && timingSafeEqual(key, expected);
}
