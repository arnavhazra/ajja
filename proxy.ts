import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminPath = process.env.ADMIN_PATH?.replace(/^\/+|\/+$/g, "");

  // Internal rewrites re-enter the proxy. The marker carries the secret path
  // itself so only a request that already survived the admin-path check is
  // trusted — outsiders cannot spoof it without knowing the path, and any
  // client-sent copy is stripped below.
  const incoming = new Headers(request.headers);
  const trusted = Boolean(adminPath) && incoming.get("x-ajja-rewritten") === adminPath;
  if (!trusted) {
    incoming.delete("x-ajja-desk");
    incoming.delete("x-ajja-prefix");
    incoming.delete("x-ajja-rewritten");
  }

  const secret = adminPath ? `/${adminPath}` : "";
  if (secret && (pathname === secret || pathname.startsWith(`${secret}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = `/desk${pathname.slice(secret.length)}` || "/desk";
    incoming.set("x-ajja-desk", "1");
    incoming.set("x-ajja-prefix", secret);
    incoming.set("x-ajja-rewritten", secret.slice(1));
    const response = NextResponse.rewrite(url, { request: { headers: incoming } });
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  if (!trusted && (pathname === "/desk" || pathname.startsWith("/desk/"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/missing";
    return NextResponse.rewrite(url, { request: { headers: incoming } });
  }

  return NextResponse.next({ request: { headers: incoming } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
