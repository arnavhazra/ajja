import { and, eq, isNull, lt, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { connection } from "next/server";
import { dropBlobIfUnused } from "@/lib/blob-retention";
import { getDb } from "@/lib/db";
import { collectionProducts, enquiries, productImages, products, productVersions } from "@/lib/db/schema";
import { getSettings } from "@/lib/public-data";

export async function GET(request: Request) {
  await connection();
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const db = getDb();
  // The publish gate holds here too — a scheduled piece only goes live when
  // it still has a photo and a real name.
  const published = await db
    .update(products)
    .set({ status: "published", updatedAt: new Date() })
    .where(
      and(
        eq(products.status, "scheduled"),
        isNull(products.deletedAt),
        sql`${products.publishAt} <= now()`,
        sql`exists (select 1 from product_images pi where pi.product_id = ${products.id})`,
        sql`btrim(${products.title}) <> '' and ${products.title} !~* '^(title not written yet|studio study)'`,
      ),
    )
    .returning({ id: products.id });

  const settings = await getSettings();
  const days = Math.min(3650, Math.max(30, settings.enquiryRetentionDays || 365));
  await db.delete(enquiries).where(sql`${enquiries.createdAt} < now() - make_interval(days => ${days})`);

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const trashed = await db.select().from(products).where(and(sql`${products.deletedAt} is not null`, lt(products.deletedAt, cutoff)));
  for (const product of trashed) {
    const images = await db.select().from(productImages).where(eq(productImages.productId, product.id));
    // Undo snapshots go with the product so they cannot pin a Blob forever.
    await db.delete(productVersions).where(eq(productVersions.productId, product.id));
    for (const image of images) {
      await dropBlobIfUnused(image.url, product.id);
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
