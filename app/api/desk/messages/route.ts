import { desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { getDb } from "@/lib/db";
import { enquiries } from "@/lib/db/schema";

export async function GET() {
  const session = await getSession();
  if (!session) return new Response("Not found", { status: 404 });
  const rows = await getDb().select().from(enquiries).orderBy(desc(enquiries.createdAt));
  const header = ["name", "contact", "message", "gift", "quantity", "bulk", "status", "created"];
  const body = rows.map((row) => [
    row.name,
    row.contact,
    row.message,
    row.giftNote,
    row.quantity == null ? "" : String(row.quantity),
    row.bulk ? "yes" : "",
    row.status,
    row.createdAt.toISOString(),
  ]);
  return new Response(toCsv([header, ...body]), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=ajja-messages.csv",
    },
  });
}
