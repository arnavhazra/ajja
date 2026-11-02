import { headers } from "next/headers";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { dayHash } from "@/lib/day-hash";

const eventSchema = z.object({
  type: z.enum(["view", "whatsapp", "call", "form", "share", "save", "search", "search-empty"]),
  productId: z.string().uuid().optional(),
  path: z.string().max(200).optional(),
  term: z.string().max(80).optional(),
});

export async function POST(request: Request) {
  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false }, { status: 400 });
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0";
  const hash = dayHash(ip, headerList.get("user-agent") ?? "", process.env.SESSION_SECRET ?? "ajja");
  await getDb().insert(events).values({
    type: parsed.data.type,
    productId: parsed.data.productId,
    path: parsed.data.path,
    term: parsed.data.term,
    dayHash: hash,
  });
  return Response.json({ ok: true });
}
