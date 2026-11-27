type HeaderReader = { get(name: string): string | null };

/**
 * Best available client identity for rate limiting/day hashes. The first
 * x-forwarded-for entry is the original client in a standard proxy chain;
 * x-real-ip is the fallback when a platform strips the forwarded list.
 */
export function clientIp(headers: HeaderReader) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip")?.trim() || "127.0.0.1";
}
