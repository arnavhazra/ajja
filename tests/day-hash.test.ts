import { describe, expect, it } from "vitest";
import { dayHash } from "@/lib/day-hash";

describe("day hash", () => {
  it("changes with the day and hides the address", () => {
    const first = dayHash("203.0.113.8", "agent", "secret", "2026-11-02");
    const nextDay = dayHash("203.0.113.8", "agent", "secret", "2026-11-03");
    expect(first).not.toBe(nextDay);
    expect(first).not.toContain("203.0.113.8");
    expect(first).toHaveLength(32);
  });
});
