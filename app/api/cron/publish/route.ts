import { del } from "@vercel/blob";
import { and, eq, isNull, lt, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { collectionProducts, enquiries, productImages, products } from "@/lib/db/schema";
import { getSettings } from "@/lib/public-data";

export async function GET(request: Request) {
  await connection();
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const db = getDb();
  const published = await db
    .update(products)
    .set({ status: "published", updatedAt: new Date() })
    .where(and(eq(products.status, "scheduled"), isNull(products.deletedAt), sql`${products.publishAt} <= now()`))
    .returning({ id: products.id });

  const settings = await getSettings();
  const days = Math.min(3650, Math.max(30, settings.enquiryRetentionDays || 365));
  await db.delete(enquiries).where(sql`${enquiries.createdAt} < now() - make_interval(days => ${days})`);

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const trashed = await db.select().from(products).where(and(sql`${products.deletedAt} is not null`, lt(products.deletedAt, cutoff)));
  for (const product of trashed) {
    const images = await db.select().from(productImages).where(eq(productImages.productId, product.id));
    for (const image of images) {
      await del(image.url).catch(() => undefined);
    }
    await db.delete(productImages).where(eq(productImages.productId, product.id));
    await db.delete(collectionProducts).where(eq(collectionProducts.productId, product.id));
    await db.delete(products).where(eq(products.id, product.id));
  }

  revalidateTag("catalog", { expire: 0 });
  revalidateTag("studio", { expire: 0 });
  revalidateTag("settings", { expire: 0 });
  return Response.json({ published: published.length, removed: trashed.length });
}
