import { neonConfig } from "@neondatabase/serverless";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * E2E fixture environment.
 *
 * .env.local points at the LIVE production Neon branch — its values are never
 * copied into process.env and never logged. It is parsed for hostnames ONLY,
 * so the fixture can refuse any E2E_DATABASE_URL that would touch production.
 *
 * The browser suite runs against an isolated Neon branch (or localhost) given
 * in E2E_DATABASE_URL — a gitignored .env.e2e file may hold it for local runs.
 * Everything the app needs comes from E2E_* inputs or @example.test fixture
 * accounts; production companions are scrubbed so nothing falls back.
 */

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function readEnvFile(file: string): Map<string, string> {
  const map = new Map<string, string>();
  const full = path.resolve(process.cwd(), file);
  if (!existsSync(full)) return map;
  for (const line of readFileSync(full, "utf8").split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const split = line.indexOf("=");
    if (split < 1) continue;
    const key = line.slice(0, split).trim();
    let value = line.slice(split + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    map.set(key, value);
  }
  return map;
}

function hostOf(raw: string | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  try {
    return new URL(value).hostname || null;
  } catch {
    // PGHOST-style bare hostnames are not URLs.
    return value;
  }
}

/** Hosts that may never receive fixture writes — names only, never values. */
export function forbiddenHosts(file = ".env.local"): Set<string> {
  const hosts = new Set<string>();
  for (const key of ["DATABASE_URL", "DATABASE_URL_UNPOOLED", "PGHOST", "PGHOST_UNPOOLED", "POSTGRES_HOST"]) {
    const host = hostOf(readEnvFile(file).get(key));
    if (host) hosts.add(host);
  }
  return hosts;
}

/**
 * Fail-closed check for the E2E database: a postgres URL on a host that is
 * either local, or a Neon branch when E2E_ISOLATED=1 — and never a host found
 * in .env.local (production). Pure so the unit suite can verify the gate
 * without ever touching a real .env.local.
 */
export function assertSafeE2eDatabaseUrl(databaseUrl: string, forbidden: ReadonlySet<string>, isolated: boolean) {
  let hostname = "";
  try {
    const parsed = new URL(databaseUrl);
    if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
      throw new Error("E2E_DATABASE_URL must be a postgres:// or postgresql:// URL.");
    }
    hostname = parsed.hostname;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("E2E_DATABASE_URL")) throw error;
    throw new Error("E2E_DATABASE_URL is not a valid URL.");
  }
  if (forbidden.has(hostname)) {
    throw new Error(
      "Refusing to run E2E against the .env.local database host. Supply a separate Neon test branch URL in E2E_DATABASE_URL.",
    );
  }
  const isNeonBranch = hostname === "neon.tech" || hostname.endsWith(".neon.tech");
  if (!LOCAL_HOSTS.has(hostname) && !(isolated && isNeonBranch)) {
    throw new Error(
      `Refusing E2E database host "${hostname}". Use a localhost database, or a *.neon.tech test branch with E2E_ISOLATED=1.`,
    );
  }
  return hostname;
}

export function applyFixtureEnv() {
  const forbidden = forbiddenHosts();

  // Optional fixture file (gitignored) — only E2E_* keys, never logged.
  for (const [key, value] of readEnvFile(".env.e2e")) {
    if (key.startsWith("E2E_") && !process.env[key]) process.env[key] = value;
  }

  // Fixture specs use raw neon() clients that never run lib/db's fetchEndpoint
  // override — capture the proxy port before the scrub below deletes NEON_*.
  const proxyPort = process.env.NEON_PROXY_PORT ?? "4444";

  const databaseUrl = (process.env.E2E_DATABASE_URL ?? "").trim();
  if (databaseUrl) {
    const hostname = assertSafeE2eDatabaseUrl(databaseUrl, forbidden, process.env.E2E_ISOLATED === "1");
    process.env.DATABASE_URL = databaseUrl;
    // Local/container Postgres behind a Neon-protocol proxy speaks plain HTTP
    // on :4444 — without this, raw neon() fixture clients would post to
    // https://localhost/sql while the app itself routes correctly.
    if (LOCAL_HOSTS.has(hostname) || hostname.endsWith(".localtest.me")) {
      const host = hostname.includes(":") ? `[${hostname}]` : hostname;
      neonConfig.fetchEndpoint = () => `http://${host}:${proxyPort}/sql`;
    }
  } else if (process.env.E2E_ISOLATED === "1") {
    // E2E_ISOLATED only counts when the fixture URL was chosen explicitly.
    // Without it an inherited (possibly production) DATABASE_URL would pass
    // e2eDbIsolated and let destructive fixtures run against it.
    delete process.env.DATABASE_URL;
  }

  process.env.SESSION_SECRET = (process.env.E2E_SESSION_SECRET ?? "").trim();
  if (!process.env.CRON_SECRET) process.env.CRON_SECRET = "e2e-cron";

  // Scrub every Postgres/Neon companion so nothing falls back to .env.local.
  for (const key of Object.keys(process.env)) {
    if (/^(PG|POSTGRES_|NEON_)/.test(key)) delete process.env[key];
  }

  // Live integrations stay off; the Blob test store is opt-in only.
  process.env.BLOB_READ_WRITE_TOKEN = (process.env.E2E_BLOB_READ_WRITE_TOKEN ?? "").trim();
  // Point the blob client at the local mock (e2e/blob-mock.mjs) when given —
  // uploads then run fully offline while assertBlobUrl still sees a
  // *.public.blob.vercel-storage.com URL (/etc/hosts maps it to 127.0.0.1).
  const blobApiUrl = (process.env.E2E_BLOB_API_URL ?? "").trim();
  if (blobApiUrl) {
    // e2e/blob-mock.mjs serves real-shaped https://*.public.blob.vercel-storage.com
    // URLs on 127.0.0.1 — the same origin for browser and server callers.
    process.env.VERCEL_BLOB_API_URL = blobApiUrl;
    process.env.NEXT_PUBLIC_VERCEL_BLOB_API_URL = blobApiUrl;
    // Server-side fetches (ingestUpload/storeImage/del) must trust the
    // self-signed cert; the browser uses playwright's ignoreHTTPSErrors.
    process.env.NODE_EXTRA_CA_CERTS = path.resolve("e2e/.blob-mock-cert.pem");
  }
  process.env.RESEND_API_KEY = "";
  process.env.OPENROUTER_API_KEY = "";
  process.env.GEMINI_API_KEY = "";

  // Fixture accounts — @example.test only, never a real inbox.
  process.env.OWNER_EMAIL = "e2e-owner@example.test";
  process.env.DEV_ADMIN_EMAIL = "e2e-dev@example.test";
  process.env.DEV_ADMIN_PASSWORD = "e2e-dev-password-long-123";
  process.env.DEV_ADMIN_TOTP_SECRET = "JBSWY3DPEHPK3PXP";
  process.env.E2E_DESK_EMAIL = "e2e-desk@example.test,e2e-security@example.test,e2e-taps@example.test";
  process.env.EMAIL_FROM = "desk@example.test";
}
