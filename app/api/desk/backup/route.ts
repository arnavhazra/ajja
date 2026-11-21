import { zipSync, strToU8 } from "fflate";
import { revalidateTag } from "next/cache";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  categories,
  collectionProducts,
  collections,
  enquiries,
  productImages,
  products,
  siteSettings,
  testimonials,
} from "@/lib/db/schema";
import { withDefaults } from "@/lib/settings";

export async function GET() {
  const session = await getSession();
  if (!session) return new Response("Not found", { status: 404 });
  const db = getDb();
  const [productRows, imageRows, categoryRows, collectionRows, linkRows, enquiryRows, quoteRows, settingRows] = await Promise.all([
    db.select().from(products),
    db.select().from(productImages),
    db.select().from(categories),
    db.select().from(collections),
    db.select().from(collectionProducts),
    db.select().from(enquiries),
    db.select().from(testimonials),
    db.select().from(siteSettings),
  ]);
  const files: Record<string, Uint8Array> = {
    "data.json": strToU8(
      JSON.stringify({
        products: productRows,
        images: imageRows,
        categories: categoryRows,
        collections: collectionRows,
        collectionProducts: linkRows,
        enquiries: enquiryRows,
        testimonials: quoteRows,
        settings: settingRows,
      }),
    ),
  };
  // Fail fast before stamping lastBackupAt — a partial image set is no backup.
  for (const image of imageRows) {
    let response: Response;
    try {
      response = await fetch(image.url);
    } catch {
      return new Response("A photo could not be downloaded — backup stopped.", { status: 502 });
    }
    if (!response.ok) {
      return new Response("A photo could not be downloaded — backup stopped.", { status: 502 });
    }
    files[`images/${image.id}.webp`] = new Uint8Array(await response.arrayBuffer());
  }
  const zipped = zipSync(files);
  const current = withDefaults(settingRows.find((row) => row.key === "shop")?.value);
  await db
    .insert(siteSettings)
    .values({ key: "shop", value: { ...current, lastBackupAt: new Date().toISOString() }, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value: { ...current, lastBackupAt: new Date().toISOString() }, updatedAt: new Date() },
    });
  revalidateTag("settings", { expire: 0 });
  return new Response(Buffer.from(zipped), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=ajja-backup.zip",
      "Cache-Control": "private, no-store",
    },
  });
}
