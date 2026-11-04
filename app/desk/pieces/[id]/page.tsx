import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DragPhoto } from "@/components/desk/drag-photo";
import { Flash, one } from "@/components/desk/flash";
import { FocalPicker } from "@/components/desk/focal-picker";
import { PhotoUpload } from "@/components/desk/upload";
import { PieceCard } from "@/components/shop/piece-card";
import {
  coverImage,
  cropImage,
  draftPiece,
  duplicatePiece,
  hidePiece,
  moveImage,
  publishPiece,
  rotateImage,
  savePhoto,
  savePiece,
  sellPiece,
  setAsHeroImage,
  trashPiece,
} from "@/lib/desk-actions";
import { loadDeskPiece, requireDesk } from "@/lib/desk-data";
import { minorToDollars } from "@/lib/money";
import { evaluatePieceReadiness } from "@/lib/piece-readiness";
import { getSettings } from "@/lib/public-data";
import { statusLabel } from "@/lib/status";
import { cn } from "@/lib/cn";
import { formatNewYorkInput } from "@/lib/time";
import type { PublicProduct } from "@/lib/types";

export default function EditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<p className="p-4">Loading…</p>}>
      <Editor params={params} searchParams={searchParams} />
    </Suspense>
  );
}

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
  const [loaded, settings] = await Promise.all([loadDeskPiece(id), getSettings()]);
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
    pigment: "#2a44c4",
    pigmentInk: "#ffffff",
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
              className={cn(
                "desk-pill font-medium",
                readiness.isReady ? "border-ok text-ok" : "border-sold text-sold",
              )}
            >
              {readiness.label}
            </span>
            {isHero ? <span className="desk-pill bg-cobalt text-white">★ Homepage Hero</span> : null}
            {product.status === "published" ? (
              <a
                href={`/p/${product.slug}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-quiet h-8 min-h-0 px-3 text-xs"
              >
                View on site ↗
              </a>
            ) : null}
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <form action={savePiece} className="grid gap-3">
          <input type="hidden" name="id" value={product.id} />
          <label className="grid gap-1">
            Name
            <input className="field" name="title" defaultValue={product.title} />
          </label>
          <label className="grid gap-1">
            Price in dollars
            <input className="field" name="price" inputMode="decimal" defaultValue={minorToDollars(product.priceMinor)} />
          </label>
          <label className="grid gap-1">
            Crossed-out price, only if it is higher
            <input className="field" name="compare" inputMode="decimal" defaultValue={minorToDollars(product.comparePriceMinor)} />
          </label>
          <label className="grid gap-1">
            Group
            <select className="field" name="categoryId" defaultValue={product.categoryId ?? ""}>
              <option value="">No group</option>
              {groups.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            Condition
            <input className="field" name="condition" defaultValue={product.condition} />
          </label>
          <label className="grid gap-1">
            Size
            <input className="field" name="size" defaultValue={attributes.size ?? ""} />
          </label>
          <label className="grid gap-1">
            Details
            <textarea className="field" name="details" defaultValue={attributes.details ?? ""} />
          </label>
          <label className="grid gap-1">
            Words for the shop
            <textarea className="field" name="description" defaultValue={product.description} />
          </label>
          <label className="grid gap-1">
            Quantity, leave blank if you are not counting
            <input className="field" name="quantity" inputMode="numeric" defaultValue={product.quantity ?? ""} />
          </label>
          <label className="grid gap-1">
            SKU
            <input className="field" name="sku" defaultValue={product.sku ?? ""} />
          </label>
          <label className="grid gap-1">
            Tags, separated by commas
            <input className="field" name="tags" defaultValue={(product.tags ?? []).join(", ")} />
          </label>
          {fields.map((field) =>
            field.key ? (
              <label key={field.key} className="grid gap-1">
                {field.label || field.key}
                <input className="field" name={`field:${field.key}`} defaultValue={attributes[field.key] ?? ""} />
              </label>
            ) : null,
          )}
          <label className="grid gap-1">
            Extra lines, written as Name: value
            <textarea className="field" name="custom" />
          </label>
          <label className="grid gap-1">
            Status
            <select className="field" name="status" defaultValue={product.status}>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">On the site</option>
              <option value="sold">Sold</option>
              <option value="hidden">Hidden</option>
            </select>
          </label>
          <label className="grid gap-1">
            Show on the site at this time, New York
            <input className="field" type="datetime-local" name="publishAt" defaultValue={formatNewYorkInput(product.publishAt)} />
          </label>
          <label className="flex min-h-12 items-center gap-3">
            <input type="checkbox" name="featured" defaultChecked={product.featured} />
            Featured
          </label>
          <label className="flex min-h-12 items-center gap-3">
            <input type="checkbox" name="showInStudio" defaultChecked={product.showInStudio} />
            Show in the studio
          </label>
          <label className="grid gap-1">
            Private notes
            <textarea className="field" name="internalNotes" defaultValue={product.internalNotes} />
          </label>
          <button className="btn btn-primary w-fit" type="submit">
            Save piece
          </button>
        </form>
        <aside className="grid gap-4">
          <div className="max-w-[390px] border border-line p-3">
            <p>Phone</p>
            <PieceCard product={preview} />
          </div>
          <div className="border border-line p-3">
            <p>Desktop</p>
            <div className="max-w-xl">
              <PieceCard product={preview} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <form action={publishPiece}>
              <input type="hidden" name="id" value={product.id} />
              <button className="btn btn-secondary" type="submit">
                Put on the site
              </button>
            </form>
            <form action={sellPiece}>
              <input type="hidden" name="id" value={product.id} />
              <button className="btn btn-secondary" type="submit">
                Mark sold
              </button>
            </form>
            <form action={hidePiece}>
              <input type="hidden" name="id" value={product.id} />
              <button className="btn btn-secondary" type="submit">
                Hide
              </button>
            </form>
            <form action={draftPiece}>
              <input type="hidden" name="id" value={product.id} />
              <button className="btn btn-quiet" type="submit">
                Draft
              </button>
            </form>
            <form action={duplicatePiece}>
              <input type="hidden" name="id" value={product.id} />
              <button className="btn btn-quiet" type="submit">
                Duplicate
              </button>
            </form>
            <form action={trashPiece}>
              <input type="hidden" name="id" value={product.id} />
              <button className="btn btn-quiet" type="submit">
                Move to trash
              </button>
            </form>
          </div>
        </aside>
      </div>
      <section className="grid gap-4">
        <h2 className="text-3xl">Photos</h2>
        <PhotoUpload productId={product.id} />
        {images.map((image, index) => (
          <article key={image.id} className="grid gap-4 border-b border-line pb-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="nums text-sm font-semibold">Photo #{index + 1}</span>
                {index === 0 ? <span className="desk-pill">Cover</span> : null}
                {settings.heroImage === image.url ? (
                  <span className="desk-pill bg-cobalt text-white">★ Current Homepage Hero</span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <form action={moveImage}>
                  <input type="hidden" name="imageId" value={image.id} />
                  <input type="hidden" name="direction" value="up" />
                  <button className="btn btn-quiet h-8 min-h-0 px-3 text-xs" type="submit" disabled={index === 0}>
                    Move up
                  </button>
                </form>
                <form action={moveImage}>
                  <input type="hidden" name="imageId" value={image.id} />
                  <input type="hidden" name="direction" value="down" />
                  <button className="btn btn-quiet h-8 min-h-0 px-3 text-xs" type="submit" disabled={index === images.length - 1}>
                    Move down
                  </button>
                </form>
                <DragPhoto id={image.id} productId={product.id} ids={images.map((item) => item.id)} />
                {index !== 0 ? (
                  <form action={coverImage}>
                    <input type="hidden" name="imageId" value={image.id} />
                    <button className="btn btn-quiet h-8 min-h-0 px-3 text-xs" type="submit">
                      Use as cover
                    </button>
                  </form>
                ) : null}
                <form action={rotateImage}>
                  <input type="hidden" name="imageId" value={image.id} />
                  <button className="btn btn-quiet h-8 min-h-0 px-3 text-xs" type="submit">
                    Turn 90°
                  </button>
                </form>
                <form action={setAsHeroImage}>
                  <input type="hidden" name="imageId" value={image.id} />
                  <button className="btn btn-secondary h-8 min-h-0 px-3 text-xs" type="submit">
                    {settings.heroImage === image.url ? "★ Refresh Hero" : "Set as Homepage Hero"}
                  </button>
                </form>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_18rem]">
              <form action={savePhoto} className="grid gap-3">
                <input type="hidden" name="imageId" value={image.id} />
                <FocalPicker
                  url={image.url}
                  initialX={Number(image.focalX)}
                  initialY={Number(image.focalY)}
                  alt={image.alt || product.title}
                />
                <label className="grid gap-1">
                  Photo description (alt text for accessibility)
                  <input className="field" name="alt" defaultValue={image.alt} placeholder="e.g. Overhead view of poured cobalt oil on raw Belgian linen" />
                </label>
                <button className="btn btn-primary self-start" type="submit">
                  Save focal point & description
                </button>
              </form>

              <div className="flex flex-col justify-between rounded-sm border border-line bg-plate/40 p-4">
                <form action={cropImage} className="grid gap-3">
                  <input type="hidden" name="imageId" value={image.id} />
                  <p className="text-sm font-semibold">Fine crop margins</p>
                  <p className="caption text-xs">Trim edges in percent (0–100).</p>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="grid gap-1 text-xs">
                      Left %
                      <input className="field h-9 text-xs" name="left" inputMode="numeric" defaultValue="0" />
                    </label>
                    <label className="grid gap-1 text-xs">
                      Top %
                      <input className="field h-9 text-xs" name="top" inputMode="numeric" defaultValue="0" />
                    </label>
                    <label className="grid gap-1 text-xs">
                      Width %
                      <input className="field h-9 text-xs" name="width" inputMode="numeric" defaultValue="100" />
                    </label>
                    <label className="grid gap-1 text-xs">
                      Height %
                      <input className="field h-9 text-xs" name="height" inputMode="numeric" defaultValue="100" />
                    </label>
                  </div>
                  <button className="btn btn-quiet mt-2" type="submit">
                    Apply crop
                  </button>
                </form>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
