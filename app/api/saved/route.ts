import { loadSaved } from "@/lib/public-data";

export async function GET(request: Request) {
  const slugs = new URL(request.url).searchParams.get("slugs")?.split(",").filter(Boolean) ?? [];
  const products = await loadSaved(slugs);
  return Response.json({
    items: products.map((product) => ({
      slug: product.slug,
      title: product.title,
      priceMinor: product.priceMinor,
      currency: product.currency,
      status: product.status,
      categoryName: product.categoryName,
      medium: product.attributes?.medium ?? null,
      image: product.images[0]
        ? {
            url: product.images[0].url,
            alt: product.images[0].alt,
            focalX: product.images[0].focalX,
            focalY: product.images[0].focalY,
          }
        : null,
    })),
  });
}
