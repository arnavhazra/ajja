import Image from "next/image";
import { pieceKind, pieceRef } from "@/lib/piece-title";
import type { ShopSettings } from "@/lib/settings";
import type { PublicProduct } from "@/lib/types";

/** The studio monograph: two-panel editorial narrative alongside a real studio plate. */
export function StudioIntro({ settings, detail }: { settings: ShopSettings; detail?: PublicProduct | null }) {
  // Hide the studio block until the owner writes a real story.
  if (!settings.story.trim()) return null;

  const photo = settings.ownerPhoto
    ? (detail?.images.find((image) => image.url === settings.ownerPhoto) ?? detail?.images[0])
    : detail?.images[0];
  const photoUrl = settings.ownerPhoto || photo?.url || "";
  const photoAlt = settings.ownerPhoto ? `${settings.ownerName} in the studio` : (photo?.alt || "A piece from the studio");
  const detailKind = detail ? pieceKind(detail.categoryName, detail.attributes) : null;

  return (
    <section id="studio" className="scroll-mt-[72px] border-t border-line py-14 md:py-20" aria-labelledby="studio-title">
      <div className="shell">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Panel: Studio Monograph Card */}
          <div
            className="flex flex-col justify-between rounded-[2px] border border-line bg-surface-low p-7 md:p-10 lg:col-span-7"
            data-reveal=""
          >
            <div>
              <p className="micro-label text-sap">Studio monograph · Archive record</p>
              <h2 id="studio-title" className="disp mt-3 text-[clamp(2.25rem,4vw,3.4rem)] text-tar">
                The studio
              </h2>
              <div className="type mt-5 max-w-2xl space-y-5 text-lg leading-relaxed text-tar">
                <p>{settings.story}</p>
                {settings.paymentNote ? (
                  <blockquote className="border-l-2 border-sap pl-5 text-base italic text-tar-soft">
                    “{settings.paymentNote}”
                  </blockquote>
                ) : null}
              </div>
            </div>

            <dl className="mt-8 grid grid-cols-1 gap-6 border-t border-line pt-6 sm:grid-cols-3">
              <div>
                <dt className="micro-label text-tar-soft">Location</dt>
                <dd className="ledger mt-1 font-bold text-tar">
                  {settings.town}, {settings.region}
                </dd>
              </div>
              <div>
                <dt className="micro-label text-tar-soft">Visiting</dt>
                <dd className="ledger mt-1 font-bold text-tar">By appointment</dd>
              </div>
              <div>
                <dt className="micro-label text-tar-soft">Arrangements</dt>
                <dd className="ledger mt-1 font-bold text-tar">Direct correspondence</dd>
              </div>
            </dl>
          </div>

          {/* Right Panel: Matted Studio Plate + Direct Provenance Card */}
          <div className="flex flex-col gap-6 lg:col-span-5" data-reveal="">
            {photoUrl ? (
              <figure className="m-0 rounded-[2px] border border-line bg-wall-deep p-3.5">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-wall-sink">
                  <Image
                    src={photoUrl}
                    alt={photoAlt}
                    fill
                    sizes="(min-width: 1024px) 38vw, 94vw"
                    placeholder={photo?.blurData ? "blur" : "empty"}
                    blurDataURL={photo?.blurData ?? undefined}
                    className="object-cover"
                    style={{ objectPosition: `${(photo?.focalX ?? 0.5) * 100}% ${(photo?.focalY ?? 0.5) * 100}%` }}
                  />
                </div>
                <figcaption className="ledger mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-tar-soft">
                  <span>
                    {!settings.ownerPhoto && detail
                      ? `[ NO. ${pieceRef(detail.id).toUpperCase()}${detailKind ? ` · ${detailKind.toUpperCase()}` : ""} ]`
                      : `[ ${settings.town.toUpperCase()}, ${settings.region.toUpperCase()} ]`}
                  </span>
                  <span>IN THE STUDIO</span>
                </figcaption>
              </figure>
            ) : null}

            <div className="flex flex-1 flex-col justify-between rounded-[2px] border border-line bg-wall-deep p-6">
              <div>
                <p className="micro-label text-sap">Direct from the maker</p>
                <p className="type mt-2.5 text-sm leading-relaxed text-tar">
                  Every piece is photographed in natural light as it stands in our {settings.town} workshop and
                  discussed directly with the family before collection or delivery.
                </p>
              </div>
              <div className="ledger mt-5 flex items-center justify-between border-t border-line pt-3.5 text-xs text-tar">
                <span>MADE BY HAND · {settings.town.toUpperCase()}</span>
                <span className="font-bold text-sap">§ DIRECT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
