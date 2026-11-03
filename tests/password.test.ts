import { describe, expect, it } from "vitest";
import { checkPassword, hashPassword } from "@/lib/password";

describe("password hashing", () => {
  it("accepts the right password and rejects others", async () => {
    const stored = await hashPassword("pour-the-blue-first");
    expect(stored.startsWith("scrypt$")).toBe(true);
    expect(await checkPassword("pour-the-blue-first", stored)).toBe(true);
    expect(await checkPassword("pour-the-red-first", stored)).toBe(false);
  });

  it("salts every hash", async () => {
    expect(await hashPassword("same")).not.toBe(await hashPassword("same"));
  });

  it("rejects malformed stored values", async () => {
    expect(await checkPassword("x", "plain-text")).toBe(false);
  });
});
