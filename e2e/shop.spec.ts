import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { neon } from "@neondatabase/serverless";
import sharp from "sharp";
import { totpCode } from "../lib/totp";

const title = "Studio test piece";

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  const sql = neon(process.env.DATABASE_URL ?? "");
  await sql`delete from product_images where product_id in (select id from products where title = ${title} or attributes->>'originalFile' = 'tiny.jpg')`;
  await sql`delete from product_versions where product_id in (select id from products where title = ${title} or attributes->>'originalFile' = 'tiny.jpg')`;
  await sql`delete from products where title = ${title} or attributes->>'originalFile' = 'tiny.jpg'`;
  await sql`delete from enquiries where name = 'Test buyer'`;
  await sql`delete from rate_limits where bucket like 'enquiry:%'`;
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
  await sql`update site_settings set value = jsonb_set(value, '{whatsapp}', '""'::jsonb, true) where key = 'shop'`;
});

test("archive home, redirects, and a missing page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Current Studio Manifest" })).toBeVisible();
  for (const old of ["/shop", "/studio", "/about", "/visit", "/sold", "/saved", "/search"]) {
    await page.goto(old);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Current Studio Manifest" })).toBeVisible();
  }
  await page.goto("/desk");
  await expect(page.getByRole("heading", { name: "That page is not here" })).toBeVisible();
  await expect(page.getByText("Sign in")).toHaveCount(0);
  const robots = await page.request.get("/robots.txt");
  expect(await robots.text()).not.toContain(process.env.ADMIN_PATH ?? "missing-path");
});

test("staff can add, price, publish, hide, undo, and share", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
  });
  const path = process.env.ADMIN_PATH ?? "";
  if (path.length < 8) throw new Error("ADMIN_PATH is not loaded");
  const secret = process.env.DEV_ADMIN_TOTP_SECRET ?? "";
  const response = await page.goto(`/${path}?staff=1`);
  if (!(await page.getByLabel("Email").count())) {
    throw new Error(`Staff form missing (${response?.status()}): ${(await page.locator("body").innerText()).slice(0, 300)}`);
  }
  await page.getByLabel("Email").fill(process.env.DEV_ADMIN_EMAIL ?? "");
  await page.getByLabel("Password").fill(process.env.DEV_ADMIN_PASSWORD ?? "");
  await page.getByLabel("Code from your app").fill(totpCode(secret));
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();

  await page.getByRole("link", { name: "Add a piece" }).click();
  await page.getByLabel("Choose a photo").setInputFiles("e2e/tiny.jpg");
  const uploaded = page.getByRole("heading", { name: "Edit this piece" });
  try {
    await expect(uploaded).toBeVisible({ timeout: 60_000 });
  } catch (error) {
    throw new Error(`${error instanceof Error ? error.message : "upload failed"}\n${(await page.locator("body").innerText()).slice(0, 700)}`);
  }
  await page.getByLabel("Name", { exact: true }).fill(title);
  await page.getByLabel("Price in dollars").fill("40");
  await page.getByRole("button", { name: "Save piece" }).click();
  await expect(page.getByRole("status")).toContainText("Saved");
  await page.getByRole("button", { name: "Put on the site" }).click();
  await expect(page.getByRole("status")).toContainText("Put on the site");

  await page.getByRole("link", { name: "Home page" }).click();
  await page.getByLabel("WhatsApp number").fill("15555550100");
  await page.getByRole("button", { name: "Save home page" }).click();
  await expect(page.getByRole("status")).toBeVisible();

  await page.goto("/p/studio-test-piece");
  const whatsapp = page.getByRole("link", { name: "Message on WhatsApp" }).first();
  await expect(whatsapp).toHaveAttribute("href", /wa\.me\/15555550100/);
  const href = await whatsapp.getAttribute("href");
  expect(decodeURIComponent(href ?? "")).toContain("Hello Ajja, I would like to ask about Studio test piece.");
  expect(decodeURIComponent(href ?? "")).toContain("The price is $40.00.");

  await page.getByLabel("Your name").fill("Test buyer");
  await page.getByLabel("Phone or email").fill("test@example.com");
  await page.getByLabel("Message").fill("Is the studio test piece still here?");
  await page.getByRole("button", { name: "Send a message" }).click();
  await expect(page.getByRole("status")).toContainText("Message saved");

  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => undefined);
  await page.getByRole("button", { name: "Share" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Link copied" })).toBeVisible();

  await page.goto(`/${path}/pieces/`);
  await page.getByRole("link", { name: title }).click();
  await page.getByRole("button", { name: "Hide" }).click();
  await expect(page.getByRole("status")).toContainText("Hidden");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByRole("status")).toContainText("undone");

  await page.goto("/");
  await expect(page.getByText(title).first()).toBeVisible();
});

test("pages stay accessible", async ({ page }) => {
  for (const path of ["/", "/policies", "/privacy"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, path).toEqual([]);
  }
  for (const width of [360, 768, 1280, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: width > 1000 ? "dark" : "light" });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});
