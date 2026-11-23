import { connection } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

// Liveness probe for uptime checks — proves the app can reach the database.
// No sensitive detail leaves: just ok/down plus a no-store cache header.
export async function GET() {
  await connection();
  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
