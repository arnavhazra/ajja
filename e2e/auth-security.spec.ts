import { expect, test } from "@playwright/test";
import { neon } from "@neondatabase/serverless";
import { hashPassword } from "../lib/password";
import { totpCode } from "../lib/totp";

const adminEmail = "e2e-security@example.test";
const adminPassword = "e2e-security-password-123";
const devEmail = process.env.DEV_ADMIN_EMAIL ?? "dev@example.test";
const devPassword = process.env.DEV_ADMIN_PASSWORD ?? "dev-pass-long-123";
const devTotp = process.env.DEV_ADMIN_TOTP_SECRET ?? "JBSWY3DPEHPK3PXP";

test.describe("Security fixes verification", () => {
  test.beforeAll(async () => {
    const sql = neon(process.env.DATABASE_URL ?? "");
    await sql`delete from sessions where email in (${adminEmail}, ${devEmail})`;
    await sql`delete from admin_users where email = ${adminEmail}`;
    await sql`insert into admin_users (email, role, password_hash) values (${adminEmail}, 'owner', ${await hashPassword(adminPassword)})
      on conflict (email) do update set password_hash = excluded.password_hash, failed_attempts = 0, locked_until = null`;
  });

  test.afterAll(async () => {
    const sql = neon(process.env.DATABASE_URL ?? "");
    await sql`delete from sessions where email in (${adminEmail}, ${devEmail})`;
    await sql`delete from admin_users where email = ${adminEmail}`;
  });

  test("unknown email rejected immediately", async ({ page }) => {
    const admin = process.env.ADMIN_PATH ?? "";
    await page.goto(`/${admin}`);
    await page.getByLabel("Email").fill("unknown-attacker@nowhere.test");
    await page.getByLabel("Password").fill("some-random-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("status")).toContainText("did not match");
  });

  test("staff sessions cannot change password without DEV_ADMIN_PASSWORD", async ({ page }) => {
    const admin = process.env.ADMIN_PATH ?? "";
    // Sign in via staff door
    await page.goto(`/${admin}?staff=1`);
    await page.getByLabel("Email").fill(devEmail);
    await page.getByLabel("Password").fill(devPassword);
    await page.getByLabel("Code from your app").fill(totpCode(devTotp, Date.now()));
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();

    // Go to account page to try setting password without current DEV_ADMIN_PASSWORD
    await page.goto(`/${admin}/account`);
    await page.getByLabel("Current password").fill("wrong-password");
    await page.locator('input[name="next"]').fill("new-secure-password-123");
    await page.locator('input[name="confirm"]').fill("new-secure-password-123");
    await page.getByRole("button", { name: "Save password" }).click();
    await expect(page.getByRole("status")).toContainText("did not match");

    // Also verify leaving current empty fails for staff
    await page.getByLabel("Current password").fill("");
    await page.locator('input[name="next"]').fill("new-secure-password-123");
    await page.locator('input[name="confirm"]').fill("new-secure-password-123");
    await page.getByRole("button", { name: "Save password" }).click();
    await expect(page.getByRole("status")).toContainText("did not match");
  });

  test("password change invalidates existing desk sessions", async ({ page, browser }) => {
    const admin = process.env.ADMIN_PATH ?? "";
    const sql = neon(process.env.DATABASE_URL ?? "");

    // Sign in on browser 1
    await page.goto(`/${admin}`);
    await page.getByLabel("Email").fill(adminEmail);
    await page.getByLabel("Password").fill(adminPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();

    // Sign in on browser 2 (simulate another active device)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto(`/${admin}`);
    await page2.getByLabel("Email").fill(adminEmail);
    await page2.getByLabel("Password").fill(adminPassword);
    await page2.getByRole("button", { name: "Sign in" }).click();
    await expect(page2.getByRole("heading", { name: "Today" })).toBeVisible();

    // Verify there are 2 active sessions in DB
    const sessionsBefore = await sql`select count(*) as count from sessions where email = ${adminEmail}`;
    expect(Number(sessionsBefore[0].count)).toBeGreaterThanOrEqual(2);

    // On page 1, change password
    const nextPassword = "next-secure-password-456";
    await page.goto(`/${admin}/account`);
    await page.getByLabel("Current password").fill(adminPassword);
    await page.locator('input[name="next"]').fill(nextPassword);
    await page.locator('input[name="confirm"]').fill(nextPassword);
    await page.getByRole("button", { name: "Save password" }).click();
    await expect(page.getByRole("status")).toContainText("Password changed");

    // Verify in database that only 1 session remains (the current session on page 1)
    const sessionsAfter = await sql`select count(*) as count from sessions where email = ${adminEmail}`;
    expect(Number(sessionsAfter[0].count)).toBe(1);

    // Page 2 should now be kicked out: visiting root desk shows sign in
    await page2.goto(`/${admin}`);
    await expect(page2.getByRole("button", { name: "Sign in" })).toBeVisible();

    // Visiting inner desk page without session returns 404 per desk security model
    await page2.goto(`/${admin}/account`);
    await expect(page2.getByRole("heading", { name: "That page is not here" })).toBeVisible();
    await context2.close();
  });
});

