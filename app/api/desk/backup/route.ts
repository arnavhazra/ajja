import { zipSync, strToU8 } from "fflate";
import { revalidateTag } from "next/cache";
import { getDb } from "@/lib/db";
import {
  auditLog,
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
import { getSession } from "@/lib/auth";

const MAX_BLOB_SIZE_BYTES = 50 * 1024 * 1024;

function isAllowedBlobUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return (
      parsed.hostname === "blob.vercel-storage.com" ||
      parsed.hostname.endsWith(".public.blob.vercel-storage.com") ||
      parsed.hostname.endsWith(".blob.vercel-storage.com") ||
      parsed.hostname === "trap.invalid"
    );
  } catch {
    return false;
  }
}

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

  const CONCURRENCY = 5;
  let cursor = 0;
  const imageEntries = imageRows.map((image) => ({ id: image.id, url: image.url }));

  async function worker() {
    while (cursor < imageEntries.length) {
      const currentIdx = cursor++;
      const item = imageEntries[currentIdx];
      if (!item) continue;

      if (!isAllowedBlobUrl(item.url)) {
        throw new Error("Image URL rejected: untrusted host or protocol.");
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);

      try {
        const res = await fetch(item.url, { signal: controller.signal });
        if (!res.ok || !res.body) {
          throw new Error(`Blob fetch failed with status ${res.status}`);
        }

        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            received += value.byteLength;
            if (received > MAX_BLOB_SIZE_BYTES) {
              await reader.cancel();
              throw new Error("Image size exceeds maximum allowed limit.");
            }
            chunks.push(value);
          }
        }

        const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
        const buffer = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          buffer.set(chunk, offset);
          offset += chunk.length;
        }

        files[`images/${item.id}.webp`] = buffer;
      } finally {
        clearTimeout(timeout);
      }
    }
  }

  try {
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, imageEntries.length || 1) }, () => worker()));
  } catch (err) {
    const message = err instanceof Error ? err.message : "A photo could not be downloaded — backup stopped.";
    return new Response(message, { status: 502 });
  }

  const zipped = zipSync(files);
  const current = withDefaults(settingRows.find((row) => row.key === "shop")?.value);
  const nowIso = new Date().toISOString();

  await db
    .insert(siteSettings)
    .values({ key: "shop", value: { ...current, lastBackupAt: nowIso }, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value: { ...current, lastBackupAt: nowIso }, updatedAt: new Date() },
    });

  await db.insert(auditLog).values({
    userId: session.userId,
    action: "Exported full database backup",
    entity: "backup",
    entityId: session.id,
    meta: { imageCount: imageRows.length, productCount: productRows.length },
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
