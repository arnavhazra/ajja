// Create a desk account or reset its password: node scripts/set-admin-password.mjs you@example.com [role]
// Reads DATABASE_URL from the environment (or .env.local). Prints a new random password once.
import { randomBytes, scrypt } from "node:crypto";
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

for (const file of [".env.local", ".env"]) {
  try {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const split = line.indexOf("=");
      if (split < 1 || line.startsWith("#")) continue;
      const key = line.slice(0, split).trim();
      if (!process.env[key]) process.env[key] = line.slice(split + 1).trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    continue;
  }
}

const email = process.argv[2]?.trim().toLowerCase();
const role = process.argv[3] ?? "owner";
if (!email || !email.includes("@")) {
  console.error("Usage: node scripts/set-admin-password.mjs you@example.com [owner|developer]");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const password = process.env.NEW_ADMIN_PASSWORD || randomBytes(15).toString("base64url");
const salt = randomBytes(16);
const key = await new Promise((resolve, reject) =>
  scrypt(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, derived) => (error ? reject(error) : resolve(derived))),
);
const hash = ["scrypt", 16384, 8, 1, salt.toString("base64url"), key.toString("base64url")].join("$");
const sql = neon(process.env.DATABASE_URL);
const [user] = await sql.query(
  `insert into admin_users (email, role, password_hash, password_changed_at)
   values ($1, $2, $3, now())
   on conflict (email) do update set password_hash = excluded.password_hash, password_changed_at = now(), failed_attempts = 0, locked_until = null
   returning id`,
  [email, role, hash],
);
await sql.query(`insert into audit_log (user_id, action, entity, entity_id, meta) values ($1, 'Set password', 'admin_user', $2, '{}'::jsonb)`, [user.id, String(user.id)]);
console.log(`Desk account ready for ${email}.`);
if (!process.env.NEW_ADMIN_PASSWORD) console.log(`Password (shown once): ${password}`);
