import { describe, expect, it } from "vitest";
import { aboutPieceSchema } from "@/lib/schemas";
import { isProvisionalSlug } from "@/lib/piece-title";
import { FUNCTION_BODY_LIMIT, planUpload, UPLOAD_ATTEMPTS, UPLOAD_MAX_BYTES } from "@/lib/upload-plan";

const uuid = "3f6f8e2c-2a5e-4b6c-9f2d-0a1b2c3d4e5f";

describe("about this piece stage", () => {
  const base = { id: uuid, title: "Green pour", categoryId: "", description: "", price: "" };

  it("accepts a name alone — category, description, and price stay optional", () => {
    const parsed = aboutPieceSchema.safeParse(base);
    expect(parsed.success).toBe(true);
    expect(parsed.data?.categoryId).toBe("");
  });

  it("rejects an empty name", () => {
    expect(aboutPieceSchema.safeParse({ ...base, title: "  " }).success).toBe(false);
  });

  it("rejects a category id that is not a uuid", () => {
    expect(aboutPieceSchema.safeParse({ ...base, categoryId: "paintings" }).success).toBe(false);
  });
});

describe("slug stability on rename", () => {
  it("only a provisional piece-* slug is replaceable", () => {
    expect(isProvisionalSlug("piece-9f8d2a")).toBe(true);
    expect(isProvisionalSlug("green-pour")).toBe(false);
    expect(isProvisionalSlug("")).toBe(false);
    expect(isProvisionalSlug(null)).toBe(false);
  });
});

describe("photo upload plan", () => {
  it("sends every supported photo direct to Blob — bytes never transit a function", () => {
    for (const size of [1, FUNCTION_BODY_LIMIT + 1, UPLOAD_MAX_BYTES]) {
      const plan = planUpload({ name: "photo.jpg", size });
      expect(plan.mode, `size ${size}`).toBe("direct");
    }
  });

  it("supports files above the 4.5 MB function body limit", () => {
    const plan = planUpload({ name: "big.jpg", size: 10 * 1024 * 1024 });
    expect(plan).toEqual({ mode: "direct", attempts: UPLOAD_ATTEMPTS });
  });

  it("rejects files over 15 MB with an explicit message", () => {
    const plan = planUpload({ name: "huge.jpg", size: UPLOAD_MAX_BYTES + 1 });
    expect(plan.mode).toBe("rejected");
    if (plan.mode === "rejected") expect(plan.message).toContain("15 MB");
  });

  it("gives a bounded retry count so failures surface explicitly", () => {
    expect(UPLOAD_ATTEMPTS).toBe(3);
  });
});
