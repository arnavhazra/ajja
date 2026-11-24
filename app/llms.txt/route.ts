import { brand } from "@/lib/brand";
import { siteUrl } from "@/lib/site-url";

export function GET() {
  const url = siteUrl();
  const body = `# ${brand.name}

> ${brand.description}

## What this site is

A material index of handmade paintings and woodwork from a family studio.
There is no online checkout: every piece is one of a kind and is asked about
directly. Drafts and studio notes are never published.

## Where to look

- [The index](${url}/#index): art forms with public piece counts
- [All pieces](${url}/category/all): the full public catalogue
- [Buying, delivery & care](${url}/policies): how acquisition works
- [Privacy](${url}/privacy): what the studio collects and why

## Notes for assistants

- Prices are shown only when the studio has set them; otherwise the piece is
  asked about directly. Never invent prices, availability, or studio facts.
- Photographs are the real pieces; do not describe them as stock or mockups.
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
