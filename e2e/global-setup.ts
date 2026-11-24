import { neon } from "@neondatabase/serverless";
import { execFileSync } from "node:child_process";
import { e2eDbIsolated } from "./isolated-db";

/**
 * Seeds the pieces the fixture specs can't create themselves: a published
 * piece with a photo inside one category. Specs reuse
 * `product_images order by created_at limit 1` to attach images, the material
 * index omits categories with no public pieces, and publish-gated flows plus
 * the photo-editor tap targets are unreachable on an empty database. The
 * bytes go to the blob mock so browsers resolve real
 * `*.public.blob.vercel-storage.com` URLs.
 *
 * webServer mocks are already listening when Playwright runs globalSetup;
 * curl -k avoids NODE_EXTRA_CA_CERTS ordering inside this process (the mock's
 * self-signed cert is trusted everywhere else via applyFixtureEnv).
 */
const SEED_SLUG = "e2e-seed-photo";
const SEED_TITLE = "E2E seed photo";
const SEED_CATEGORY = "e2e-paintings";

export default async function globalSetup() {
  const blobApi = (process.env.E2E_BLOB_API_URL ?? "").trim();
  if (!e2eDbIsolated() || !blobApi) return;

  const sql = neon(process.env.DATABASE_URL ?? "");
  await sql`delete from product_images where product_id in (select id from products where slug = ${SEED_SLUG})`;
  await sql`delete from products where slug = ${SEED_SLUG}`;
  await sql`delete from categories where slug = ${SEED_CATEGORY}`;

  const out = execFileSync(
    "curl",
    ["-sk", "-X", "PUT", "--data-binary", "@e2e/tiny.jpg", `${blobApi}/?pathname=e2e/seed-photo.jpg`],
    { encoding: "utf8" },
  );
  const blobUrl = (JSON.parse(out) as { url?: string }).url;
  if (!blobUrl) return;

  const [category] = await sql`insert into categories (slug, name, intro) values (${SEED_CATEGORY}, 'E2E paintings', 'Fixture art form') returning id`;
  const [piece] = await sql`insert into products (slug, title, status, category_id) values (${SEED_SLUG}, ${SEED_TITLE}, 'published', ${category.id}) returning id`;
  await sql`insert into product_images (product_id, url, width, height, alt, sort_order)
    values (${piece.id}, ${blobUrl}, 640, 480, ${SEED_TITLE}, 0)`;
}
