import { describe, expect, it } from "vitest";
import { enquirySchema } from "@/lib/schemas";

describe("enquiry", () => {
  it("accepts a short message", () => {
    const parsed = enquirySchema.safeParse({ name: "Ada", contact: "ada@example.com", message: "Is this still here?" });
    expect(parsed.success).toBe(true);
  });

  it("asks for a way to reply", () => {
    const parsed = enquirySchema.safeParse({ name: "Ada", contact: "nope", message: "Hello" });
    expect(parsed.success).toBe(false);
  });

  it("treats a blank quantity as not set", () => {
    const parsed = enquirySchema.safeParse({ name: "Ada", contact: "6105550100", message: "Hello", quantity: "", productId: "" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.quantity).toBeUndefined();
  });
});
