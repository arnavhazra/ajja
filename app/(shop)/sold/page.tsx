import type { Metadata } from "next";
import { ProductCard } from "@/components/product-card";
import { loadSold } from "@/lib/public-data";

export const metadata: Metadata = { title: "Sold", description: "Pieces that have already been sold." };

export default async function SoldPage() {
  const products = await loadSold(60);
  return (
    <main className="px-4 py-8 md:px-8">
      <header className="border-b border-line pb-6">
        <h1 className="text-4xl text-ink md:text-5xl">Sold</h1>
        <p className="measure mt-3 text-ink-soft">These pieces have been sold. You can still ask about something similar.</p>
      </header>
      {products.length ? (
        <div className="hang mt-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} href={`/p/${product.slug}`} />
          ))}
        </div>
      ) : (
        <p className="mt-8 text-ink-soft">No sold pieces are listed yet.</p>
      )}
    </main>
  );
}
