import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { neon } from "@neondatabase/serverless";
import sharp from "sharp";
import { hashPassword } from "../lib/password";
import { e2eDbIsolated } from "./isolated-db";

const title = "Studio test piece";
const slug = "studio-test-piece";
const adminEmail = "e2e-desk@example.test";
const adminPassword = "e2e-desk-password-long";
// Unique fixture ids — cleanup never keys on a generic name that could hit real data.
const uploadTitle = "E2E Uploaded Draft";
const bigUploadTitle = "E2E Big Upload";
const smallFile = "e2e-upload-small.jpg";
const bigFile = "e2e-upload-big.jpg";
const fixtureTitles = [title, uploadTitle, bigUploadTitle];
const fixtureFiles = [smallFile, bigFile];

let smallPhoto: Buffer;

test.describe.configure({ mode: "serial" });
test.skip(!e2eDbIsolated(), "DATABASE_URL is not confirmed isolated — set E2E_ISOLATED=1 and E2E_DATABASE_URL to a test branch");

test.beforeAll(async () => {
  const sql = neon(process.env.DATABASE_URL ?? "");
  await sql`delete from product_images where product_id in (select id from products where title = any(${fixtureTitles}) or attributes->>'originalFile' = any(${fixtureFiles}))`;
  await sql`delete from product_versions where product_id in (select id from products where title = any(${fixtureTitles}) or attributes->>'originalFile' = any(${fixtureFiles}))`;
  await sql`delete from products where title = any(${fixtureTitles}) or attributes->>'originalFile' = any(${fixtureFiles})`;
  await sql`delete from enquiries where name = 'Test buyer'`;
  await sql`delete from sessions where email = ${adminEmail}`;
  await sql`insert into admin_users (email, role, password_hash) values (${adminEmail}, 'owner', ${await hashPassword(adminPassword)})
    on conflict (email) do update set password_hash = excluded.password_hash, failed_attempts = 0, locked_until = null`;
  const [photo] = await sql`select url, width, height, blur_data from product_images order by created_at limit 1`;
  const [piece] = await sql`insert into products (slug, title, status) values (${slug}, ${title}, 'draft') returning id`;
  if (photo) {
    await sql`insert into product_images (product_id, url, width, height, blur_data, alt, sort_order)
      values (${piece.id}, ${photo.url}, ${photo.width}, ${photo.height}, ${photo.blur_data}, ${title}, 0)`;
  }
  // In-memory fixtures — the suite never writes files into the repo.
  smallPhoto = await sharp({
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
    .toBuffer();
});

test.afterAll(async () => {
  const sql = neon(process.env.DATABASE_URL ?? "");
  await sql`delete from product_images where product_id in (select id from products where title = any(${fixtureTitles}) or attributes->>'originalFile' = any(${fixtureFiles}))`;
  await sql`delete from product_versions where product_id in (select id from products where title = any(${fixtureTitles}) or attributes->>'originalFile' = any(${fixtureFiles}))`;
  await sql`delete from products where title = any(${fixtureTitles}) or attributes->>'originalFile' = any(${fixtureFiles})`;
  await sql`delete from enquiries where name = 'Test buyer'`;
  await sql`delete from sessions where email = ${adminEmail}`;
  await sql`delete from admin_users where email = ${adminEmail}`;
});

test("home, redirects, category routes, and a missing page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("#index-title").first()).toBeVisible();
  // The index opens on category links — no hero scroll — and All pieces is one of them.
  await expect(page.locator('.idx a[href="/category/all"]')).toBeVisible();
  for (const old of ["/shop", "/studio", "/about", "/visit", "/sold", "/saved", "/search"]) {
    await page.goto(old);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("#index-title").first()).toBeVisible();
  }
  // /category/all lists only public pieces; unknown slugs are 404.
  await page.goto("/category/all");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.goto("/category/not-a-real-art-form");
  await expect(page.getByRole("heading", { name: "That page is not here" })).toBeVisible();
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

  await page.getByRole("link", { name: "My pieces", exact: true }).click();
  await page.getByRole("link", { name: title }).click();
  await expect(page.getByRole("heading", { name: "Edit this piece" })).toBeVisible();
  await page.getByLabel("Price in US dollars").fill("40");
  await page.getByRole("button", { name: "Save piece" }).click();
  await expect(page.getByRole("status")).toContainText("Saved");
  await page.getByRole("button", { name: "Put on the site" }).click();
  await expect(page.getByRole("status")).toContainText("Put on the site");

  await page.getByRole("link", { name: "Settings" }).click();
  await page.getByRole("link", { name: "Home page wording & contact" }).click();
  await page.getByLabel("WhatsApp number").fill("15555550100");
  await page.getByRole("button", { name: "Save home page" }).click();
  await expect(page.getByRole("status")).toBeVisible();

  await page.goto(`/p/${slug}`);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  // One enquiry action — the note form — not a row of contact buttons.
  await expect(page.locator('main a[href*="wa.me"]')).toHaveCount(0);

  const enquire = page.locator("#enquire");
  await enquire.getByLabel("Your name").fill("Test buyer");
  await enquire.getByLabel("Phone or email").fill("test@example.com");
  await enquire.getByLabel("Message").fill("Is the studio test piece still here?");
  await enquire.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Message saved");

  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => undefined);
  await page.getByRole("button", { name: "Share" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Link copied" })).toBeVisible();

  await page.goto(`/${path}/pieces`);
  await page.getByRole("link", { name: `Edit ${title}`, exact: true }).click();
  await expect(page.getByRole("heading", { name: "Edit this piece" })).toBeVisible();
  await page.getByRole("button", { name: "Hide" }).click();
  await expect(page.getByRole("status")).toContainText("Hidden");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("status")).toContainText("undone");

  // The published piece is listed under All pieces, and hides show up on the index.
  await page.goto("/category/all");
  await expect(page.getByText(title).first()).toBeVisible();
});

test("photo upload makes a private draft that publishes through review", async ({ page }) => {
  test.skip(!process.env.E2E_BLOB_READ_WRITE_TOKEN, "Needs E2E_BLOB_READ_WRITE_TOKEN for a separate test Blob store");
  await page.goto(`/${process.env.ADMIN_PATH}`);
  await page.getByLabel("Email").fill(adminEmail);
  await page.getByLabel("Password").fill(adminPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: "Add a piece", exact: true }).click();
  await page.getByLabel("Choose photos").setInputFiles({ name: smallFile, mimeType: "image/jpeg", buffer: smallPhoto });
  // Step 2 — about this piece. The draft is private until "Show on site".
  await expect(page.getByRole("heading", { name: "About this piece" })).toBeVisible({ timeout: 60_000 });
  await page.getByLabel("Name", { exact: true }).fill(uploadTitle);
  await page.getByRole("button", { name: "Save and continue" }).click();
  // Step 3 — review shows the visitor view before anything goes live.
  await expect(page.getByRole("heading", { name: "Review" })).toBeVisible();
  await expect(page.getByText(/only you can see this/i)).toBeVisible();
  await page.getByRole("button", { name: "Show on site" }).click();
  await expect(page.getByRole("status")).toContainText("Put on the site");
  await page.goto("/category/all");
  await expect(page.getByText(uploadTitle).first()).toBeVisible();
});

test("pages stay accessible", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of ["/", "/category/all", "/policies", "/privacy", `/p/${slug}`]) {
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
  for (const [link, route, heading] of [
    ["My pieces", "/pieces", "Pieces"],
    ["Messages", "/messages", "Messages"],
    ["Groups", "/groups", "Groups"],
    ["Numbers", "/insights", "Numbers"],
    ["Files", "/files", "Files"],
  ] as const) {
    await page.getByRole("link", { name: link }).first().click();
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, link).toEqual([]);
  }
  for (const [hubLink, route, h1] of [
    ["Home page wording & contact", "/home", "Home page"],
    ["Account & password", "/account", "Account"],
  ] as const) {
    await page.getByRole("link", { name: "Settings", exact: true }).click();
    await page.getByRole("link", { name: hubLink, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    await expect(page.getByRole("heading", { level: 1, name: h1 })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, h1).toEqual([]);
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const width of [360, 768, 1280, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: width > 1000 ? "dark" : "light" });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});
