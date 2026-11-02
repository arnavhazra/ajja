import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Neon is the database for this shop.");
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
