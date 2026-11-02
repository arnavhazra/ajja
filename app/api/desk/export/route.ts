import { asc, isNull } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { getDb } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { minorToDollars } from "@/lib/money";

export async function GET() {
  const session = await getSession();
  if (!session) return new Response("Not found", { status: 404 });
  const db = getDb();
  const rows = await db.select().from(products).where(isNull(products.deletedAt)).orderBy(asc(products.title));
  const groups = await db.select().from(categories);
  const header = ["filename", "slug", "title", "price", "compare", "category", "condition", "size", "details", "quantity", "sku", "tags", "status"];
  const body = rows.map((row) => {
    const attributes = (row.attributes ?? {}) as Record<string, string>;
    const group = groups.find((item) => item.id === row.categoryId);
    return [
      attributes.originalFile ?? "",
      row.slug,
      row.title,
      minorToDollars(row.priceMinor),
      minorToDollars(row.comparePriceMinor),
      group?.name ?? "",
      row.condition,
      attributes.size ?? "",
      attributes.details ?? "",
      row.quantity == null ? "" : String(row.quantity),
      row.sku ?? "",
      (row.tags ?? []).join(", "),
      row.status,
    ];
  });
  return new Response(toCsv([header, ...body]), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=ajja-pieces.csv",
    },
  });
}
