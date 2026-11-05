import { expect, test } from "@playwright/test";
import { neon } from "@neondatabase/serverless";
import { hashPassword } from "../lib/password";

const adminEmail = (process.env.DEV_ADMIN_EMAIL || process.env.OWNER_EMAIL || "e2e-taps@example.test").toLowerCase();
const adminPassword = "e2e-taps-password-long";
const title = "Tap Target Piece";
const slug = "tap-target-piece";

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  const sql = neon(process.env.DATABASE_URL ?? "");
  await sql`delete from product_images where product_id in (select id from products where slug = ${slug})`;
  await sql`delete from products where slug = ${slug}`;
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
  await sql`delete from product_images where product_id in (select id from products where slug = ${slug})`;
  await sql`delete from products where slug = ${slug}`;
  await sql`delete from sessions where email = ${adminEmail}`;
  await sql`delete from admin_users where email = ${adminEmail}`;
});

async function expectBigEnough(locator: ReturnType<import("@playwright/test").Page["locator"]>, context: string) {
  const count = await locator.count();
  expect(count, `${context}: no targets found`).toBeGreaterThan(0);
  for (let i = 0; i < count; i += 1) {
    const box = await locator.nth(i).boundingBox();
    if (!box) continue; // not rendered in this viewport
    expect(box.height, `${context} #${i} height ${box.height}`).toBeGreaterThanOrEqual(44);
    expect(box.width, `${context} #${i} width ${box.width}`).toBeGreaterThanOrEqual(44);
  }
}

test("works wall filters and card actions are at least 44px", async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const works = page.locator("#works:visible").first();
    await expect(works).toBeVisible();
    await expectBigEnough(works.locator("button"), `works buttons at ${width}px`);
  }
});

test("folio sheet traps focus and closes on escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: /^Save/ }).first().click();
  const dialog = page.getByRole("dialog", { name: "Saved pieces" });
  await expect(dialog).toBeVisible();
  const focusInside = await page.evaluate(() => {
    const panel = document.querySelector('[role="dialog"]');
    return Boolean(panel && document.activeElement && panel.contains(document.activeElement));
  });
  expect(focusInside, "focus should land inside the sheet").toBe(true);
  // Tab wraps inside the sheet rather than escaping to the page behind it.
  for (let i = 0; i < 8; i += 1) await page.keyboard.press("Tab");
  const stillInside = await page.evaluate(() => {
    const panel = document.querySelector('[role="dialog"]');
    return Boolean(panel && document.activeElement && panel.contains(document.activeElement));
  });
  expect(stillInside, "focus should stay inside the sheet").toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("desk editor icon buttons are at least 44px", async ({ page }) => {
  const admin = process.env.ADMIN_PATH ?? "";
  if (admin.length < 8) throw new Error("ADMIN_PATH is not loaded");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/${admin}`);
  await page.getByLabel("Email").fill(adminEmail);
  await page.getByLabel("Password").fill(adminPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();

  const sql = neon(process.env.DATABASE_URL ?? "");
  const [piece] = await sql`select id from products where slug = ${slug} limit 1`;
  await page.goto(`/${admin}/pieces/${piece.id}`);
  await expect(page.locator("#photos")).toBeVisible();
  await expectBigEnough(page.locator("#photos button"), "desk photo buttons at 390px");
});
