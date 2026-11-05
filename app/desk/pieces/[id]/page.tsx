import { Suspense } from "react";
import { notFound } from "next/navigation";
import { EditorAids } from "@/components/desk/editor-aids";
import { EditorForm } from "@/components/desk/editor-form";
import { EditorPreview } from "@/components/desk/editor-preview";
import { PhotoManager } from "@/components/desk/photo-manager";
import { DeskRowsSkeleton } from "@/components/desk/skeleton";
import { Flash, one } from "@/components/desk/flash";
import { loadDeskPiece, loadPieceNeighbors, requireDesk } from "@/lib/desk-data";
import { deskPrefix } from "@/lib/desk-path";
import { evaluatePieceReadiness } from "@/lib/piece-readiness";
import { pigmentFromDataUri } from "@/lib/pigment";
import { getSettings } from "@/lib/public-data";
import { statusLabel } from "@/lib/status";
import { cn } from "@/lib/cn";
import type { PublicProduct } from "@/lib/types";

// after()-scheduled photo tidy can outlive the response; give it room.
export const maxDuration = 120;

export default function EditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<DeskRowsSkeleton rows={5} />}>
      <Editor params={params} searchParams={searchParams} />
    </Suspense>
  );
}

const MISSING_ANCHORS: Record<string, string> = {
  photo: "#photos",
  title: "#f-title",
  group: "#f-group",
  dimensions: "#f-size",
};

async function Editor({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesk();
  const { id } = await params;
  const query = await searchParams;
  const [loaded, settings, prefix, neighbors] = await Promise.all([
    loadDeskPiece(id),
    getSettings(),
    deskPrefix(),
    loadPieceNeighbors(id),
  ]);
  if (!loaded) notFound();
  const { product, images, groups } = loaded;
  const attributes = (product.attributes ?? {}) as Record<string, string>;
  const group = groups.find((item) => item.id === product.categoryId);
  const fields = Array.isArray(group?.fieldSchema) ? (group.fieldSchema as { key?: string; label?: string }[]) : [];
  const isHero = images.some((img) => img.url === settings.heroImage);
  const readiness = evaluatePieceReadiness({
    title: product.title,
    categoryId: product.categoryId,
    attributes,
    priceMinor: product.priceMinor,
    hasPhoto: images.length > 0,
  });
  const standardKeys = new Set(["size", "details", "stripe_url", "stripe_payment_link", "medium", "dimensions", ...fields.map((f) => f.key)]);
  const customText = Object.entries(attributes)
    .filter(([k]) => !standardKeys.has(k))
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  const pigment = await pigmentFromDataUri(images[0]?.blurData ?? null);
  const preview: PublicProduct = {
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description,
    priceMinor: product.priceMinor,
    comparePriceMinor: product.comparePriceMinor,
    currency: product.currency,
    condition: product.condition,
    quantity: product.quantity,
    sku: product.sku,
    attributes,
    tags: product.tags ?? [],
    status: product.status,
    featured: product.featured,
    showInStudio: product.showInStudio,
    categoryId: product.categoryId,
    categoryName: group?.name ?? null,
    categorySlug: group?.slug ?? null,
    createdAt: product.createdAt.toISOString(),
    pigment: pigment.hex,
    pigmentInk: pigment.ink,
    images: images.map((image) => ({
      id: image.id,
      url: image.url,
      width: image.width,
      height: image.height,
      blurData: image.blurData,
      focalX: Number(image.focalX),
      focalY: Number(image.focalY),
      alt: image.alt,
      sortOrder: image.sortOrder,
    })),
  };
  return (
    <main className="desk-page">
      <Flash note={one(query.note)} undo={one(query.undo)} back={`/pieces/${product.id}`} />
      <div className="desk-lead">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h1 className="text-4xl">Edit this piece</h1>
            <p className="desk-note">Blank price stays blank. Nothing is invented for you.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="desk-pill" data-status={product.status}>
              {statusLabel(product.status)}
            </span>
            <span
              className={cn("desk-pill font-medium")}
              data-tone={readiness.isReady ? "ok" : "warn"}
            >
              {readiness.label}
            </span>
            {isHero ? <span className="desk-pill bg-cobalt text-white">★ Homepage hero</span> : null}
            {product.status === "published" ? (
              <a
                href={`/p/${product.slug}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-quiet min-h-11 px-3 text-xs"
              >
                View on site ↗
              </a>
            ) : null}
          </div>
        </div>
        {!readiness.isReady ? (
          <nav className="flex flex-wrap items-center gap-2" aria-label="What this piece still needs">
            <span className="text-sm text-ink-soft">To finish:</span>
            {readiness.missing.map((item) => {
              const key = item.toLowerCase();
              return (
                <a key={item} className="desk-chip" href={MISSING_ANCHORS[key] ?? "#piece-form"}>
                  Add {key === "dimensions" ? "a size" : `a ${key}`}
                </a>
              );
            })}
          </nav>
        ) : null}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <EditorForm product={product} groups={groups} fields={fields} customText={customText} />
        <EditorPreview productId={product.id} preview={preview} />
      </div>
      <PhotoManager product={product} images={images} heroImage={settings.heroImage} />
      <EditorAids
        formId="piece-form"
        prevHref={neighbors.prevId ? `${prefix}/pieces/${neighbors.prevId}` : ""}
        nextHref={neighbors.nextId ? `${prefix}/pieces/${neighbors.nextId}` : ""}
      />
    </main>
  );
}
