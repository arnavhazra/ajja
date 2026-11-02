import { describe, expect, it } from "vitest";
import { pieceMessage, whatsAppHref } from "@/lib/whatsapp";

describe("whatsapp", () => {
  it("builds the ask message", () => {
    expect(
      pieceMessage({ shop: "Ajja", title: "Green pour", price: "$40.00", url: "https://example.com/p/green" }),
    ).toBe("Hello Ajja, I would like to ask about Green pour. The price is $40.00. https://example.com/p/green");
  });

  it("omits a price that was not written", () => {
    expect(pieceMessage({ shop: "Ajja", title: "", price: null, url: "https://example.com/studio/piece" })).toBe(
      "Hello Ajja, I would like to ask about a piece from the studio. https://example.com/studio/piece",
    );
  });

  it("puts the message on the WhatsApp link", () => {
    const href = whatsAppHref("(610) 555-0100", "Hello");
    expect(href.startsWith("https://wa.me/6105550100?text=")).toBe(true);
    expect(decodeURIComponent(href)).toContain("Hello");
  });
});
