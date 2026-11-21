/** JSON-LD body with `<` escaped so the script tag can never be broken out of. */
export function jsonLdSource(data: Record<string, unknown>) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSource(data) }} />;
}
