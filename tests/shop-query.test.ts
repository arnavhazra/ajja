import { describe, expect, it } from "vitest";
import { parseShopQuery, shopHref } from "@/lib/shop-query";

describe("shop query", () => {
  it("reads filters from the address", () => {
    const query = parseShopQuery({ q: "green", category: "paintings", min: "10", max: "40", sort: "price-asc", availability: "available" });
    expect(query).toMatchObject({ q: "green", category: "paintings", min: 1000, max: 4000, sort: "price-asc", availability: "available" });
    expect(shopHref(query)).toBe("/shop?q=green&category=paintings&availability=available&min=10&max=40&sort=price-asc");
  });

  it("ignores a sort it does not know", () => {
    expect(parseShopQuery({ sort: "random" }).sort).toBe("newest");
    expect(shopHref(parseShopQuery({}))).toBe("/shop");
  });
});
