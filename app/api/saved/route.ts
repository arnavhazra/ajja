import { loadSaved } from "@/lib/public-data";

export async function GET(request: Request) {
  const slugs = new URL(request.url).searchParams.get("slugs")?.split(",") ?? [];
  const products = await loadSaved(slugs);
  return Response.json({
    products: products.map((product) => ({
      slug: product.slug,
      title: product.title,
      priceMinor: product.priceMinor,
      currency: product.currency,
      status: product.status,
      image: product.images[0]?.url ?? null,
      alt: product.images[0]?.alt ?? "",
      focalX: product.images[0]?.focalX ?? 0.5,
      focalY: product.images[0]?.focalY ?? 0.5,
      categoryName: product.categoryName,
    })),
  });
}
