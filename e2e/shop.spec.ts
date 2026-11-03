import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { neon } from "@neondatabase/serverless";
import sharp from "sharp";
import { hashPassword } from "../lib/password";

const title = "Studio test piece";
const slug = "studio-test-piece";
const adminEmail = "e2e-desk@example.test";
const adminPassword = "e2e-desk-password-long";

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  const sql = neon(process.env.DATABASE_URL ?? "");
  await sql`delete from product_images where product_id in (select id from products where title = ${title} or attributes->>'originalFile' = 'tiny.jpg')`;
  await sql`delete from product_versions where product_id in (select id from products where title = ${title} or attributes->>'originalFile' = 'tiny.jpg')`;
  await sql`delete from products where title = ${title} or attributes->>'originalFile' = 'tiny.jpg'`;
  await sql`delete from enquiries where name = 'Test buyer'`;
  await sql`delete from rate_limits where bucket like 'enquiry:%'`;
  await sql`delete from sessions where email = ${adminEmail}`;
  await sql`insert into admin_users (email, role, password_hash) values (${adminEmail}, 'owner', ${await hashPassword(adminPassword)})
    on conflict (email) do update set password_hash = excluded.password_hash, failed_attempts = 0, locked_until = null`;
  const [photo] = await sql`select url, width, height, blur_data from product_images order by created_at limit 1`;
  const [piece] = await sql`insert into products (slug, title, status) values (${slug}, ${title}, 'draft') returning id`;
  if (photo) {
    await sql`insert into product_images (product_id, url, width, height, blur_data, alt, sort_order)
      values (${piece.id}, ${photo.url}, ${photo.width}, ${photo.height}, ${photo.blur_data}, ${title}, 0)`;
  }
  await sharp({
    create: {
      width: 80,
      height: 100,
      channels: 3,
      background: {
        r: Math.floor(Math.random() * 200 + 20),
        g: Math.floor(Math.random() * 200 + 20),
        b: Math.floor(Math.random() * 200 + 20),
      },
    },
  })
    .jpeg()
    .toFile("e2e/tiny.jpg");
});

test.afterAll(async () => {
  const sql = neon(process.env.DATABASE_URL ?? "");
  await sql`delete from product_images where product_id in (select id from products where title = ${title} or attributes->>'originalFile' = 'tiny.jpg')`;
  await sql`delete from product_versions where product_id in (select id from products where title = ${title} or attributes->>'originalFile' = 'tiny.jpg')`;
  await sql`delete from products where title = ${title} or attributes->>'originalFile' = 'tiny.jpg'`;
  await sql`delete from enquiries where name = 'Test buyer'`;
  await sql`delete from sessions where email = ${adminEmail}`;
  await sql`delete from admin_users where email = ${adminEmail}`;
  await sql`update site_settings set value = jsonb_set(value, '{whatsapp}', '""'::jsonb, true) where key = 'shop'`;
});

test("home, redirects, and a missing page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "The works" })).toBeVisible();
  for (const old of ["/shop", "/studio", "/about", "/visit", "/sold", "/saved", "/search"]) {
    await page.goto(old);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "The works" })).toBeVisible();
  }
  await page.goto("/desk");
  await expect(page.getByRole("heading", { name: "That page is not here" })).toBeVisible();
  await expect(page.getByText("Sign in")).toHaveCount(0);
  const robots = await page.request.get("/robots.txt");
  expect(await robots.text()).not.toContain(process.env.ADMIN_PATH ?? "missing-path");
});

test("owner signs in with a password, prices, publishes, hides, undoes, and shares", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
  });
  const path = process.env.ADMIN_PATH ?? "";
  if (path.length < 8) throw new Error("ADMIN_PATH is not loaded");
  await page.goto(`/${path}`);
  await page.getByLabel("Email").fill(adminEmail);
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("status")).toContainText("did not match");
  await page.getByLabel("Email").fill(adminEmail);
  await page.getByLabel("Password").fill(adminPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();

  await page.getByRole("link", { name: "Pieces", exact: true }).click();
  await page.getByRole("link", { name: title }).click();
  await expect(page.getByRole("heading", { name: "Edit this piece" })).toBeVisible();
  await page.getByLabel("Price in dollars").fill("40");
  await page.getByRole("button", { name: "Save piece" }).click();
  await expect(page.getByRole("status")).toContainText("Saved");
  await page.getByRole("button", { name: "Put on the site" }).click();
  await expect(page.getByRole("status")).toContainText("Put on the site");

  await page.getByRole("link", { name: "Home page" }).click();
  await page.getByLabel("WhatsApp number").fill("15555550100");
  await page.getByRole("button", { name: "Save home page" }).click();
  await expect(page.getByRole("status")).toBeVisible();

  await page.goto(`/p/${slug}`);
  const whatsapp = page.locator('main a[href*="wa.me"][href*="text="]').first();
  await expect(whatsapp).toHaveAttribute("href", /wa\.me\/15555550100/);
  const href = await whatsapp.getAttribute("href");
  expect(decodeURIComponent(href ?? "")).toContain("Hello Ajja, I would like to ask about Studio test piece.");
  expect(decodeURIComponent(href ?? "")).toContain("The price is $40.00.");

  await page.getByLabel("Your name").fill("Test buyer");
  await page.getByLabel("Phone or email").fill("test@example.com");
  await page.getByLabel("Message").fill("Is the studio test piece still here?");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Message saved");

  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => undefined);
  await page.getByRole("button", { name: "Share" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Link copied" })).toBeVisible();

  await page.goto(`/${path}/pieces`);
  await page.getByRole("link", { name: title }).click();
  await page.getByRole("button", { name: "Hide" }).click();
  await expect(page.getByRole("status")).toContainText("Hidden");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("status")).toContainText("undone");

  await page.goto("/");
  await expect(page.getByText(title).first()).toBeVisible();
});

test("photo upload makes a draft", async ({ page }) => {
  test.skip(!process.env.BLOB_READ_WRITE_TOKEN, "Needs a Blob token");
  await page.goto(`/${process.env.ADMIN_PATH}`);
  await page.getByLabel("Email").fill(adminEmail);
  await page.getByLabel("Password").fill(adminPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: "Add a piece" }).click();
  await page.getByLabel("Choose a photo").setInputFiles("e2e/tiny.jpg");
  await expect(page.getByRole("heading", { name: "Edit this piece" })).toBeVisible({ timeout: 60_000 });
});

test("pages stay accessible", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of ["/", "/policies", "/privacy", `/p/${slug}`]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, path).toEqual([]);
  }
  const admin = process.env.ADMIN_PATH ?? "";
  await page.goto(`/${admin}`);
  await expect(page.getByLabel("Password")).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations, "sign in").toEqual([]);
  await page.getByLabel("Email").fill(adminEmail);
  await page.getByLabel("Password").fill(adminPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  for (const [link, route] of [
    ["Pieces", "/pieces"],
    ["Home page", "/home"],
    ["Account", "/account"],
  ] as const) {
    await page.getByRole("link", { name: link, exact: true }).first().click();
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    await expect(page.getByRole("heading", { level: 1, name: link })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, link).toEqual([]);
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const width of [360, 768, 1280, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: width > 1000 ? "dark" : "light" });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});
