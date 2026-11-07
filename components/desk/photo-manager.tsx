import { DragPhoto } from "@/components/desk/drag-photo";
import { FocalPicker } from "@/components/desk/focal-picker";
import { PhotoUpload } from "@/components/desk/upload";
import { coverImage, cropImage, moveImage, retryEnhance, rotateImage, savePhoto, setAsHeroImage } from "@/lib/desk-actions";
import type { productImages } from "@/lib/db/schema";

type Image = typeof productImages.$inferSelect;

export function PhotoManager({
  product,
  images,
  heroImage,
}: {
  product: { id: string; title: string; attributes?: Record<string, unknown> };
  images: Image[];
  heroImage: string;
}) {
  const enhancedMap = (product.attributes?.enhancedVersions ?? {}) as Record<string, string>;
  const enhancedById = new Map(images.filter((i) => i.alt === "enhanced-version").map((i) => [i.id, i]));
  const enhanceStatus = (product.attributes?.enhance ?? {}) as unknown as Record<string, { status?: string }>;
  const originals = images.filter((i) => i.alt !== "enhanced-version");
  return (
    <section className="grid gap-4" id="photos">
      <h2 className="text-3xl">Photos</h2>
      <PhotoUpload productId={product.id} />
      {originals.map((image, index) => (
        <article key={image.id} className="grid gap-4 border-b border-line pb-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="nums text-sm font-semibold">Photo #{index + 1}</span>
              {index === 0 ? <span className="desk-pill">Cover</span> : null}
              {heroImage === image.url ? (
                <span className="desk-pill bg-sap text-white">★ Homepage hero</span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <form action={moveImage}>
                <input type="hidden" name="imageId" value={image.id} />
                <input type="hidden" name="direction" value="up" />
                <button className="btn btn-quiet min-h-11 px-3 text-xs" type="submit" disabled={index === 0}>
                  Move up
                </button>
              </form>
              <form action={moveImage}>
                <input type="hidden" name="imageId" value={image.id} />
                <input type="hidden" name="direction" value="down" />
                <button className="btn btn-quiet min-h-11 px-3 text-xs" type="submit" disabled={index === images.length - 1}>
                  Move down
                </button>
              </form>
              <DragPhoto id={image.id} productId={product.id} ids={images.map((item) => item.id)} />
              {index !== 0 ? (
                <form action={coverImage}>
                  <input type="hidden" name="imageId" value={image.id} />
                  <button className="btn btn-quiet min-h-11 px-3 text-xs" type="submit">
                    Use as cover
                  </button>
                </form>
              ) : null}
              <form action={rotateImage}>
                <input type="hidden" name="imageId" value={image.id} />
                <button className="btn btn-quiet min-h-11 px-3 text-xs" type="submit">
                  Turn 90°
                </button>
              </form>
              <form action={setAsHeroImage}>
                <input type="hidden" name="imageId" value={image.id} />
                <button className="btn btn-secondary min-h-11 px-3 text-xs" type="submit">
                  {heroImage === image.url ? "★ Refresh hero" : "Set as homepage hero"}
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
                <input className="field" name="alt" defaultValue={image.alt} placeholder="e.g. Overhead view of a poured painting on raw linen" />
              </label>
              <button className="btn btn-primary self-start" type="submit">
                Save focal point & description
              </button>
            </form>

            <div className="flex flex-col justify-between rounded-sm border border-line bg-wall-deep/40 p-4">
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

          {(() => {
            const status = enhanceStatus[image.id]?.status;
            if (status === "pending") return <p className="tag">Tidying photo…</p>;
            if (status === "failed")
              return (
                <div className="flex flex-wrap items-center gap-2">
                  <p className="tag">Couldn&rsquo;t tidy this photo</p>
                  <form action={retryEnhance}>
                    <input type="hidden" name="imageId" value={image.id} />
                    <input type="hidden" name="productId" value={product.id} />
                    <button className="btn btn-quiet min-h-11 px-3 text-xs" type="submit">
                      Try again
                    </button>
                  </form>
                </div>
              );
            if (status === "done") return <p className="tag">Tidied</p>;
            return null;
          })()}

          {enhancedMap[image.id] && enhancedById.get(enhancedMap[image.id]) ? (
            <div className="grid gap-2 border border-line bg-wall p-3">
              <p className="text-sm font-semibold">Original / Enhanced</p>
              <div className="grid grid-cols-2 gap-3">
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element -- desk comparison thumb */}
                  <img src={image.url} alt={`${image.alt || product.title} — original`} className="w-full rounded-[2px] border border-line" />
                  <figcaption className="tag mt-1">Original</figcaption>
                </figure>
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element -- desk comparison thumb */}
                  <img src={enhancedById.get(enhancedMap[image.id])!.url} alt={`${image.alt || product.title} — enhanced`} className="w-full rounded-[2px] border border-line" />
                  <figcaption className="tag mt-1">Enhanced</figcaption>
                </figure>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <form action={coverImage}>
                  <input type="hidden" name="imageId" value={enhancedMap[image.id]} />
                  <button className="btn btn-secondary min-h-11 px-3 text-xs" type="submit">
                    Use enhanced as cover
                  </button>
                </form>
                <p className="desk-note text-xs">The original stays in place — nothing on the site changes unless you say so.</p>
              </div>
            </div>
          ) : null}
        </article>
      ))}
    </section>
  );
}
