// Local Vercel Blob stand-in for E2E runs — HTTPS on e2e.public.blob.vercel-storage.com
// (mapped to 127.0.0.1 in /etc/hosts) so CSP `upgrade-insecure-requests`,
// `connect-src https://*.public.blob.vercel-storage.com`, and the app's
// assertBlobUrl all see the real URL shape with zero application-code changes.
// Implements client/server PUT /?pathname, POST /delete, and GET /<pathname>.
// The self-signed cert lives in e2e/.blob-mock-*.pem (gitignored, openssl).
// Binding :443 needs cap_net_bind_service on the node binary or root.
import { createServer } from "node:https";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.BLOB_MOCK_PORT ?? 443);
const PUBLIC_HOST = process.env.BLOB_MOCK_PUBLIC_HOST ?? "e2e.public.blob.vercel-storage.com";
const PUBLIC_ORIGIN = `https://${PUBLIC_HOST}${PORT === 443 ? "" : `:${PORT}`}`;

const objects = new Map(); // pathname -> { bytes, contentType }

function withRandomSuffix(pathname) {
  const slash = pathname.lastIndexOf("/");
  const dir_ = slash >= 0 ? pathname.slice(0, slash + 1) : "";
  const name = slash >= 0 ? pathname.slice(slash + 1) : pathname;
  const dot = name.lastIndexOf(".");
  return `${dir_}${dot >= 0 ? name.slice(0, dot) : name}-${randomUUID().slice(0, 8)}${dot >= 0 ? name.slice(dot) : ""}`;
}

const server = createServer(
  {
    key: readFileSync(path.join(dir, ".blob-mock-key.pem")),
    cert: readFileSync(path.join(dir, ".blob-mock-cert.pem")),
  },
  (req, res) => {
    const cors = {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,PUT,POST,DELETE,OPTIONS",
      "access-control-allow-headers": req.headers["access-control-request-headers"] ?? "*",
      "access-control-expose-headers": "*",
    };
    if (req.method === "OPTIONS") {
      res.writeHead(204, cors).end();
      return;
    }

    const url = new URL(req.url ?? "/", PUBLIC_ORIGIN);

    if (req.method === "GET" && url.pathname === "/healthz") {
      res.writeHead(200, { ...cors, "content-type": "text/plain" }).end("ok");
      return;
    }

    if (req.method === "PUT" && url.pathname === "/") {
      let pathname = url.searchParams.get("pathname") ?? `incoming/${randomUUID()}`;
      if (req.headers["x-add-random-suffix"] === "1") pathname = withRandomSuffix(pathname);
      const chunks = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => {
        const bytes = Buffer.concat(chunks);
        const contentType = req.headers["content-type"] ?? "application/octet-stream";
        objects.set(pathname, { bytes, contentType });
        const blobUrl = `${PUBLIC_ORIGIN}/${pathname}`;
        res.writeHead(200, { ...cors, "content-type": "application/json" });
        res.end(
          JSON.stringify({
            url: blobUrl,
            downloadUrl: blobUrl,
            pathname,
            contentType,
            contentDisposition: `inline; filename="${pathname.split("/").pop()}"`,
          }),
        );
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/delete") {
      const chunks = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => {
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
          for (const item of body.urls ?? []) {
            objects.delete(new URL(item, PUBLIC_ORIGIN).pathname.slice(1));
          }
        } catch {
          // Best-effort, same as the app's `.catch(() => undefined)`.
        }
        res.writeHead(200, { ...cors, "content-type": "application/json" }).end("{}");
      });
      return;
    }

    if ((req.method === "GET" || req.method === "HEAD") && objects.has(url.pathname.slice(1))) {
      const item = objects.get(url.pathname.slice(1));
      res.writeHead(200, {
        ...cors,
        "content-type": item.contentType,
        "content-length": item.bytes.length,
      });
      res.end(req.method === "GET" ? item.bytes : undefined);
      return;
    }

    res.writeHead(404, { ...cors, "content-type": "application/json" });
    res.end(JSON.stringify({ error: { code: "not_found", message: "The requested blob does not exist" } }));
  },
);

server.listen(PORT, "127.0.0.1", () => {
  console.log(`blob-mock listening on https://${PUBLIC_HOST}:${PORT} (127.0.0.1)`);
});
