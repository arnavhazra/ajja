import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { headers } from "next/headers";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";
import { allowRate } from "@/lib/rate-limit";
import { getSession } from "@/lib/auth";
import { clientIp } from "@/lib/request-ip";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"] as const;
const MAX_SIZE_BYTES = 15 * 1024 * 1024;

const uploadTokenSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.string().max(100).optional(),
});

function mimeFromName(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".heic")) return "image/heic";
  if (lower.endsWith(".heif")) return "image/heif";
  return null;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: "Please sign in again." }, { status: 401 });
  }

  const headerList = await headers();
  const ip = clientIp(headerList);
  const rateAllowed = await allowRate(`upload-token:${session.userId}:${ip}`, 60, 60 * 10);
  if (!rateAllowed) {
    return Response.json({ message: "Too many upload requests. Please wait a moment." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const parsed = uploadTokenSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ message: "Invalid upload parameters. Only JPG, PNG, WebP, HEIC, or HEIF images up to 15MB are supported." }, { status: 400 });
  }

  const safeName = parsed.data.name.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 120) || "photo";
  const rawName = parsed.data.name;
  const mimeType = parsed.data.type && (ALLOWED_TYPES as readonly string[]).includes(parsed.data.type)
    ? parsed.data.type
    : mimeFromName(rawName) ?? mimeFromName(rawName.replace(/[^a-zA-Z0-9._-]/g, ""));
  if (!mimeType) {
    return Response.json({ message: "Invalid upload parameters. Only JPG, PNG, WebP, HEIC, or HEIF images up to 15MB are supported." }, { status: 400 });
  }
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
    meta: { filename: safeName, mimeType },
  });

  return Response.json(
    { token, pathname, type: mimeType },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
