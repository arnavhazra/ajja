// TLS terminator in front of `next start` for E2E: the app's CSP sends
// `upgrade-insecure-requests` and WebKit applies it even to loopback fetches,
// so parity testing needs the app itself on https. Cert is shared with
// e2e/blob-mock.mjs (SANs: e2e.public.blob.vercel-storage.com, localhost,
// 127.0.0.1); playwright trusts it via ignoreHTTPSErrors.
import { createServer } from "node:https";
import { request } from "node:http";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.E2E_PROXY_PORT ?? 3443);
const UPSTREAM = process.env.E2E_PROXY_TARGET ?? "http://127.0.0.1:3211";

const server = createServer(
  {
    key: readFileSync(path.join(dir, ".blob-mock-key.pem")),
    cert: readFileSync(path.join(dir, ".blob-mock-cert.pem")),
  },
  (req, res) => {
    const upstream = request(
      UPSTREAM + req.url,
      {
        method: req.method,
        headers: {
          ...req.headers,
          "x-forwarded-host": req.headers.host,
        },
      },
      (up) => {
        res.writeHead(up.statusCode ?? 502, up.headers);
        up.pipe(res);
      },
    );
    upstream.on("error", () => {
      if (!res.headersSent) res.writeHead(502);
      res.end();
    });
    req.pipe(upstream);
  },
);

server.listen(PORT, "127.0.0.1", () => {
  console.log(`e2e https proxy https://127.0.0.1:${PORT} -> ${UPSTREAM}`);
});
