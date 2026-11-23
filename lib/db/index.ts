import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Neon is the database for this shop.");
  }
  // CI and local dev can point DATABASE_URL at a containerised Postgres behind a
  // Neon-protocol proxy (localtest.me or localhost) — that endpoint is plain
  // HTTP on :4444, not the TLS endpoint the driver assumes for Neon hosts.
  try {
    const { hostname } = new URL(url);
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localtest.me")) {
      const port = process.env.NEON_PROXY_PORT ?? "4444";
      neonConfig.fetchEndpoint = () => `http://${hostname}:${port}/sql`;
    }
  } catch {
    // Unparseable URL: fall through and let the driver report the problem.
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
}

let database: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!database) database = createDb();
  return database;
}

export type Database = ReturnType<typeof getDb>;
