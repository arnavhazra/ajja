import { describe, expect, it } from "vitest";
import { totpCode, verifyTotp } from "@/lib/totp";

describe("totp", () => {
  it("accepts the current code", () => {
    const secret = "JBSWY3DPEHPK3PXP";
    const now = Date.UTC(2026, 10, 2, 12, 0, 0);
    expect(verifyTotp(secret, totpCode(secret, now), now)).toBe(true);
    expect(verifyTotp(secret, "000000", now)).toBe(false);
  });
});
