import { describe, expect, it } from "vitest";
import { assertSafeE2eDatabaseUrl, forbiddenHosts } from "../e2e/fixture-env";

const PROD_HOSTS = new Set(["ep-prod-example-abc123.us-east-1.aws.neon.tech"]);

describe("assertSafeE2eDatabaseUrl", () => {
  it("accepts an isolated Neon branch when E2E_ISOLATED=1", () => {
    expect(
      assertSafeE2eDatabaseUrl("postgresql://e2e:e2e@ep-test-branch-000.us-east-1.aws.neon.tech/neondb", PROD_HOSTS, true),
    ).toBe("ep-test-branch-000.us-east-1.aws.neon.tech");
  });

  it("refuses a Neon branch without E2E_ISOLATED=1", () => {
    expect(() =>
      assertSafeE2eDatabaseUrl("postgresql://e2e:e2e@ep-test-branch-000.us-east-1.aws.neon.tech/neondb", PROD_HOSTS, false),
    ).toThrow(/E2E_ISOLATED/);
  });

  it("refuses the production host even with E2E_ISOLATED=1", () => {
    expect(() =>
      assertSafeE2eDatabaseUrl("postgresql://prod:prod@ep-prod-example-abc123.us-east-1.aws.neon.tech/neondb", PROD_HOSTS, true),
    ).toThrow(/\.env\.local/);
  });

  it("accepts a localhost database", () => {
    for (const host of ["localhost", "127.0.0.1", "[::1]"]) {
      expect(assertSafeE2eDatabaseUrl(`postgresql://e2e:e2e@${host}/e2e`, PROD_HOSTS, false)).toBe(host);
    }
  });

  it("refuses non-postgres URLs and non-Neon hosts", () => {
    expect(() => assertSafeE2eDatabaseUrl("https://example.com/db", PROD_HOSTS, true)).toThrow(/postgres/);
    expect(() => assertSafeE2eDatabaseUrl("postgresql://a:b@db.supabase.co/postgres", PROD_HOSTS, true)).toThrow(/Refusing/);
    expect(() => assertSafeE2eDatabaseUrl("not a url", PROD_HOSTS, true)).toThrow(/not a valid URL/);
  });
});

describe("forbiddenHosts", () => {
  it("returns an empty set when no env file exists", () => {
    expect(forbiddenHosts(".env.does-not-exist-test-fixture").size).toBe(0);
  });
});
