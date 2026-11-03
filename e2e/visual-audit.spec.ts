import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { hashPassword } from "../lib/password";

const SCREENSHOT_DIR = path.resolve(process.cwd(), "screenshots");
mkdirSync(SCREENSHOT_DIR, { recursive: true });

const adminEmail = "e2e-desk@example.test";
const adminPassword = "e2e-desk-password-long";
const title = "Visual Audit Specimen";
const slug = "visual-audit-specimen";

test.describe("Visual Audit & AI Screenshot Capture", () => {
  test.beforeAll(async () => {
    const sql = neon(process.env.DATABASE_URL ?? "");
    await sql`delete from product_images where product_id in (select id from products where title = ${title})`;
    await sql`delete from product_versions where product_id in (select id from products where title = ${title})`;
    await sql`delete from products where title = ${title}`;
    await sql`delete from sessions where email = ${adminEmail}`;
    await sql`insert into admin_users (email, role, password_hash) values (${adminEmail}, 'owner', ${await hashPassword(adminPassword)})
      on conflict (email) do update set password_hash = excluded.password_hash, failed_attempts = 0, locked_until = null`;

    const [photo] = await sql`select url, width, height, blur_data from product_images order by created_at limit 1`;
    const [piece] = await sql`insert into products (slug, title, status) values (${slug}, ${title}, 'published') returning id`;
    if (photo) {
      await sql`insert into product_images (product_id, url, width, height, blur_data, alt, sort_order)
        values (${piece.id}, ${photo.url}, ${photo.width}, ${photo.height}, ${photo.blur_data}, ${title}, 0)`;
    }
  });

  test.afterAll(async () => {
    const sql = neon(process.env.DATABASE_URL ?? "");
    await sql`delete from product_images where product_id in (select id from products where title = ${title})`;
    await sql`delete from product_versions where product_id in (select id from products where title = ${title})`;
    await sql`delete from products where title = ${title}`;
    await sql`delete from sessions where email = ${adminEmail}`;
    await sql`delete from admin_users where email = ${adminEmail}`;
  });

  test("capture storefront desktop and mobile", async ({ page }) => {
    // Desktop 1440x900
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01-storefront-desktop-full.png"), fullPage: true });

    const works = page.locator("#works");
    if (await works.count()) {
      await works.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02-storefront-desktop-works.png") });
    }

    const footer = page.locator("footer");
    if (await footer.count()) {
      await footer.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03-storefront-desktop-footer.png") });
    }

    // Mobile 390x844
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04-storefront-mobile-full.png"), fullPage: true });
  });

  test("capture piece detail page and zoom modal", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/p/${slug}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05-piece-detail-desktop.png"), fullPage: true });

    // Open zoom dialog
    const zoomButton = page.locator('button[aria-label*="full screen"]');
    if (await zoomButton.count()) {
      await zoomButton.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "06-piece-zoom-modal.png") });
    }
  });

  test("capture desk login doors and verify email code form persistence", async ({ page }) => {
    const admin = process.env.ADMIN_PATH ?? "";
    await page.setViewportSize({ width: 1440, height: 900 });

    // 1. Password Form
    await page.goto(`/${admin}`, { waitUntil: "networkidle" });
    await expect(page.getByLabel("Password")).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "07-desk-password-form.png") });

    // 2. Email Code Form
    await page.goto(`/${admin}?code=1`, { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: "Email me a code" })).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "08-desk-code-form-initial.png") });

    // Submit code request and verify form does not disappear
    await page.getByLabel("Email").first().fill(process.env.OWNER_EMAIL ?? "test@example.com");
    await page.getByRole("button", { name: "Email me a code" }).click();

    // Must still show code input form with status notice
    await expect(page.getByLabel("Code")).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "09-desk-code-form-requested.png") });

    // 3. Staff Door
    await page.goto(`/${admin}?staff=1`, { waitUntil: "networkidle" });
    await expect(page.getByLabel("Code from your app")).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "10-desk-staff-door.png") });
  });

  test("capture desk draft review framing", async ({ page }) => {
    const admin = process.env.ADMIN_PATH ?? "";
    const sql = neon(process.env.DATABASE_URL ?? "");
    await sql`delete from product_images where product_id in (select id from products where slug = 'draft-review-test')`;
    await sql`delete from products where slug = 'draft-review-test'`;
    const [photo] = await sql`select url, width, height, blur_data from product_images order by created_at limit 1`;
    const [draft] = await sql`insert into products (slug, title, status) values ('draft-review-test', 'Draft Specimen Under Review', 'draft') returning id`;
    if (photo) {
      await sql`insert into product_images (product_id, url, width, height, blur_data, alt, sort_order)
        values (${draft.id}, ${photo.url}, ${photo.width}, ${photo.height}, ${photo.blur_data}, 'Draft Specimen Under Review', 0)`;
    }

    await page.setViewportSize({ width: 1440, height: 900 });

    // Log in
    await page.goto(`/${admin}`, { waitUntil: "networkidle" });
    await page.getByLabel("Email").fill(adminEmail);
    await page.getByLabel("Password").fill(adminPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();

    // Visit review page
    await page.goto(`/${admin}/review`, { waitUntil: "networkidle" });
    await expect(page.locator("figure.photo-frame")).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "11-desk-review-page.png") });

    await sql`delete from product_images where product_id in (select id from products where slug = 'draft-review-test')`;
    await sql`delete from products where slug = 'draft-review-test'`;
  });
});

