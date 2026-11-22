import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { headers } from "next/headers";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { allowRate } from "@/lib/rate-limit";
import { getSession } from "@/lib/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"] as const;
const MAX_SIZE_BYTES = 15 * 1024 * 1024;

const uploadTokenSchema = z.object({
  name: z.string().min(1).max(120),
  type: z.enum(ALLOWED_TYPES),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: "Please sign in again." }, { status: 401 });
  }

  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  const ip = forwardedFor?.split(",").pop()?.trim() || headerList.get("x-real-ip")?.trim() || "127.0.0.1";
  const rateAllowed = await allowRate(`upload-token:${session.userId}:${ip}`, 10, 60 * 10);
  if (!rateAllowed) {
    return Response.json({ message: "Too many upload requests. Please wait a moment." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const parsed = uploadTokenSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ message: "Invalid upload parameters. Only JPG, PNG, WebP, HEIC, or HEIF images up to 15MB are supported." }, { status: 400 });
  }

  const safeName = parsed.data.name.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 80) || "photo";
  const pathname = `incoming/${crypto.randomUUID()}-${safeName}`;

  const token = await generateClientTokenFromReadWriteToken({
    pathname,
    allowedContentTypes: [...ALLOWED_TYPES],
    maximumSizeInBytes: MAX_SIZE_BYTES,
    addRandomSuffix: true,
  });

  const db = getDb();
  await db.insert(auditLog).values({
    userId: session.userId,
    action: "Generated upload token",
    entity: "blob_upload",
    entityId: pathname,
    meta: { filename: safeName, mimeType: parsed.data.type },
  });

  return Response.json(
    { token, pathname, type: parsed.data.type },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
