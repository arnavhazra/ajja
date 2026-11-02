import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { getSession } from "@/lib/auth";

const TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ message: "Please sign in again." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { name?: string; type?: string } | null;
  const safeName = String(body?.name ?? "photo").replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 80) || "photo";
  const type = TYPES.includes(body?.type ?? "") ? body?.type : "image/jpeg";
  const pathname = `incoming/${crypto.randomUUID()}-${safeName}`;
  const token = await generateClientTokenFromReadWriteToken({
    pathname,
    allowedContentTypes: TYPES,
    maximumSizeInBytes: 15 * 1024 * 1024,
    addRandomSuffix: true,
  });
  return Response.json({ token, pathname, type });
}
