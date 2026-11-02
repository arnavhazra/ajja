import type { Metadata } from "next";
import { ProductCard } from "@/components/product-card";
import { loadStudio } from "@/lib/public-data";

export const metadata: Metadata = {
  title: "Studio",
  description: "Photographs of work from the studio. A price is shown only after it is written in.",
};

export default async function StudioPage() {
  const pieces = await loadStudio();
  return (
    <main className="px-4 py-8 md:px-8">
      <header className="border-b border-line pb-6">
        <h1 className="text-4xl text-ink md:text-5xl">Studio</h1>
        <p className="measure mt-3 text-ink-soft">
          These are photographs of the work. A name and a price appear here only after they are written in. Asking about a photograph sends a message about that piece.
        </p>
      </header>
      {pieces.length ? (
        <div className="hang mt-8">
          {pieces.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="measure mt-8 text-ink-soft">No photographs have been added yet.</p>
      )}
    </main>
  );
}
