import "server-only";

import { del } from "@vercel/blob";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "./db";
import { categories, collections, productImages, productVersions, siteSettings } from "./db/schema";

/**
 * True while a Blob URL is still referenced anywhere — another product's
 * photo rows (duplicates share URLs), site settings (hero / owner photo), a
 * group or collection cover, or an un-undone snapshot from the last 30 days.
 * `exceptProductId` ignores a product's own photo rows (trash purge).
 */
async function blobStillReferenced(url: string, exceptProductId?: string): Promise<boolean> {
  const db = getDb();
  const imageRows = await db
    .select({ productId: productImages.productId })
    .from(productImages)
    .where(eq(productImages.url, url))
    .limit(40);
  if (imageRows.some((row) => row.productId !== exceptProductId)) return true;
  const [setting] = await db
    .select({ key: siteSettings.key })
    .from(siteSettings)
    .where(
      and(
        eq(siteSettings.key, "shop"),
        sql`(${siteSettings.value}->>'heroImage' = ${url} or ${siteSettings.value}->>'ownerPhoto' = ${url})`,
      ),
    )
    .limit(1);
  if (setting) return true;
  const [group] = await db.select({ id: categories.id }).from(categories).where(eq(categories.imageUrl, url)).limit(1);
  if (group) return true;
  const [collection] = await db.select({ id: collections.id }).from(collections).where(eq(collections.imageUrl, url)).limit(1);
  if (collection) return true;
  const [version] = await db
    .select({ id: productVersions.id })
    .from(productVersions)
    .where(
      and(
        isNull(productVersions.undoneAt),
        sql`${productVersions.createdAt} > now() - interval '30 days'`,
        sql`${productVersions.snapshot}::text like '%' || ${url} || '%'`,
      ),
    )
    .limit(1);
  return Boolean(version);
}

/** Delete a Blob only once nothing can still point at it. */
export async function dropBlobIfUnused(url: string, exceptProductId?: string) {
  if (!(await blobStillReferenced(url, exceptProductId))) await del(url).catch(() => undefined);
}
