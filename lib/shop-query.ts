export type ShopQuery = {
  q: string;
  category: string;
  condition: string;
  availability: "" | "available" | "sold";
  min: number | null;
  max: number | null;
  sort: "newest" | "price-asc" | "price-desc" | "featured";
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function dollars(value: string) {
  if (!value.trim()) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return null;
  return Math.round(number * 100);
}

export function parseShopQuery(input: Record<string, string | string[] | undefined>): ShopQuery {
  const sort = first(input.sort);
  const availability = first(input.availability);
  return {
    q: first(input.q).trim().slice(0, 80),
    category: first(input.category).slice(0, 80),
    condition: first(input.condition).slice(0, 40),
    availability: availability === "available" || availability === "sold" ? availability : "",
    min: dollars(first(input.min)),
    max: dollars(first(input.max)),
    sort: sort === "price-asc" || sort === "price-desc" || sort === "featured" ? sort : "newest",
  };
}

export function shopHref(query: ShopQuery) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.category) params.set("category", query.category);
  if (query.condition) params.set("condition", query.condition);
  if (query.availability) params.set("availability", query.availability);
  if (query.min != null) params.set("min", String(query.min / 100));
  if (query.max != null) params.set("max", String(query.max / 100));
  if (query.sort !== "newest") params.set("sort", query.sort);
  const text = params.toString();
  return text ? `/shop?${text}` : "/shop";
}
