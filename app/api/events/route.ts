import { headers } from "next/headers";
import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { events, products } from "@/lib/db/schema";
import { dayHash } from "@/lib/day-hash";
import { allowRate } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request-ip";

const eventSchema = z.object({
  type: z.enum(["view", "whatsapp", "call", "form", "share", "save", "search", "search-empty"]),
  productId: z.string().uuid().optional(),
  path: z.string().max(200).optional(),
  term: z.string().max(80).optional(),
});

export async function POST(request: Request) {
  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ ok: false }, { status: 400 });
  }

  const headerList = await headers();
  const ip = clientIp(headerList);
  const userAgent = headerList.get("user-agent") ?? "";
  const hash = dayHash(ip, userAgent, process.env.SESSION_SECRET ?? "dev-anonymous-events");
  const rateHash = dayHash(ip, "quota", process.env.SESSION_SECRET ?? "dev-anonymous-events");

  const allowed = await allowRate(`events:${rateHash.slice(0, 20)}`, 60, 60);
  if (!allowed) {
    return Response.json({ ok: false }, { status: 429 });
  }

  const db = getDb();
  let validProductId: string | null = null;

  if (parsed.data.productId) {
    const [product] = await db
      .select({ id: products.id })
      .from(products)
      .where(
        and(
          eq(products.id, parsed.data.productId),
          isNull(products.deletedAt),
          sql`(
            ${products.status} in ('published', 'sold')
            or (${products.status} = 'scheduled' and ${products.publishAt} is not null and ${products.publishAt} <= now())
          )`,
        ),
      )
      .limit(1);

    if (!product) {
      return Response.json({ ok: true });
    }
    validProductId = product.id;
  }

  await db.insert(events).values({
    type: parsed.data.type,
    productId: validProductId,
    path: parsed.data.path?.slice(0, 200),
    term: parsed.data.term?.slice(0, 80),
    dayHash: hash,
  });

  return Response.json({ ok: true });
}
