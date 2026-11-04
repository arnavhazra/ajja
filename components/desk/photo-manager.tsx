import { DragPhoto } from "@/components/desk/drag-photo";
import { FocalPicker } from "@/components/desk/focal-picker";
import { PhotoUpload } from "@/components/desk/upload";
import { coverImage, cropImage, moveImage, rotateImage, savePhoto, setAsHeroImage } from "@/lib/desk-actions";
import type { productImages } from "@/lib/db/schema";

type Image = typeof productImages.$inferSelect;

export function PhotoManager({
  product,
  images,
  heroImage,
}: {
  product: { id: string; title: string };
  images: Image[];
  heroImage: string;
}) {
  return (
    <section className="grid gap-4" id="photos">
      <h2 className="text-3xl">Photos</h2>
      <PhotoUpload productId={product.id} />
      {images.map((image, index) => (
        <article key={image.id} className="grid gap-4 border-b border-line pb-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="nums text-sm font-semibold">Photo #{index + 1}</span>
              {index === 0 ? <span className="desk-pill">Cover</span> : null}
              {heroImage === image.url ? (
                <span className="desk-pill bg-cobalt text-white">★ Homepage hero</span>
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
  );
}
