import { neon } from "@neondatabase/serverless";
import fs from "node:fs";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const d3 = fs.readFileSync("drizzle/0003_performance_indexes.sql", "utf8");
  const statements = d3
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !s.startsWith("--"));

  for (const statement of statements) {
    try {
      await sql.query(statement);
      console.log("OK:", statement.slice(0, 60));
    } catch (err) {
      console.error("FAIL:", statement, err);
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
