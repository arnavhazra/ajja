import { NextResponse, type NextRequest } from "next/server";
import { optimizeHomeHtml } from "@/lib/home-html.mjs";

export async function proxy(request: NextRequest) {
  const homeDocument =
    request.method === "GET" &&
    request.nextUrl.pathname === "/" &&
    !request.nextUrl.searchParams.has("_rsc") &&
    request.headers.get("x-ajja-lcp") !== "1" &&
    (request.headers.get("accept") || "").includes("text/html");
  if (homeDocument) {
    const headers = new Headers(request.headers);
    headers.set("x-ajja-lcp", "1");
    const upstream = await fetch(request.nextUrl, { headers, redirect: "manual" });
    const type = upstream.headers.get("content-type") || "";
    if (type.includes("text/html")) {
      const html = optimizeHomeHtml(await upstream.text());
      const out = new Headers(upstream.headers);
      out.delete("content-length");
      out.delete("content-encoding");
      return new NextResponse(html, { status: upstream.status, headers: out });
    }
    return new NextResponse(upstream.body, { status: upstream.status, headers: upstream.headers });
  }

  const { pathname } = request.nextUrl;
  const rewritten = request.headers.get("x-ajja-rewritten") === "1";
  if (!rewritten && (pathname === "/desk" || pathname.startsWith("/desk/"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/missing";
    return NextResponse.rewrite(url);
  }

  const adminPath = process.env.ADMIN_PATH;
  if (!adminPath || rewritten) return NextResponse.next();
  const secret = `/${adminPath}`;
  if (pathname === secret || pathname.startsWith(`${secret}/`)) {
    const url = request.nextUrl.clone();
    url.pathname = `/desk${pathname.slice(secret.length)}` || "/desk";
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-ajja-desk", "1");
    requestHeaders.set("x-ajja-prefix", secret);
    requestHeaders.set("x-ajja-rewritten", "1");
    const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
