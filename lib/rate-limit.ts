import "server-only";

import { sql } from "drizzle-orm";
import { getDb } from "./db";

export async function allowRate(bucket: string, limit: number, windowSeconds: number) {
  const db = getDb();
  const result = await db.execute<{ count: number }>(sql`
    insert into rate_limits (bucket, window_start, count)
    values (
      ${bucket},
      to_timestamp(floor(extract(epoch from now()) / ${windowSeconds}) * ${windowSeconds}),
      1
    )
    on conflict (bucket, window_start)
    do update set count = rate_limits.count + 1
    returning count
  `);
  const count = Number(result.rows[0]?.count ?? limit + 1);
  return count <= limit;
}
