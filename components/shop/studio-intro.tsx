import Image from "next/image";
import { pieceKind, pieceRef } from "@/lib/piece-title";
import type { ShopSettings } from "@/lib/settings";
import type { PublicProduct } from "@/lib/types";

/** The bench: a photograph of one piece beside what the owner wrote about the studio. */
export function StudioIntro({ settings, detail }: { settings: ShopSettings; detail?: PublicProduct | null }) {
  // The bench block is only real bio + town — hide it entirely until the owner writes one.
  if (!settings.story.trim()) return null;
  const photo = settings.ownerPhoto
    ? (detail?.images.find((image) => image.url === settings.ownerPhoto) ?? detail?.images[0])
    : detail?.images[0];
  const photoUrl = settings.ownerPhoto || photo?.url || "";
  const photoAlt = settings.ownerPhoto ? `${settings.ownerName} in the studio` : (photo?.alt || "A piece from the studio");
  const detailKind = detail ? pieceKind(detail.categoryName, detail.attributes) : null;
  const ratio = photo?.width && photo?.height ? photo.width / photo.height : 4 / 5;

  return (
    <section id="studio" className="bench shell scroll-mt-[60px]" aria-labelledby="studio-title">
      <div>
        <p className="kicker">From the bench</p>
        <h2 id="studio-title" className="display mt-[10px] text-[clamp(2.6rem,5.2vw,5rem)]" data-reveal="">
          Made by hand in {settings.town}
        </h2>
        <div className="prose mt-6 max-w-[46ch]">
          <p>{settings.story}</p>
        </div>
        <dl className="honesty">
          <div>
            <dt>Where</dt>
            <dd>
              {settings.town}, {settings.region}
            </dd>
          </div>
          <div>
            <dt>Visiting</dt>
            <dd>By appointment</dd>
          </div>
          <div>
            <dt>Payment</dt>
            <dd>{settings.paymentNote}</dd>
          </div>
        </dl>
      </div>

      {photoUrl ? (
        <figure className="bench-photo" style={{ "--ratio": ratio } as React.CSSProperties} data-reveal="">
          <div className="ph">
            <Image
              src={photoUrl}
              alt={photoAlt}
              fill
              sizes="(min-width: 960px) 36vw, 100vw"
              placeholder={photo?.blurData ? "blur" : "empty"}
              blurDataURL={photo?.blurData ?? undefined}
              className="object-cover"
              style={{ objectPosition: `${(photo?.focalX ?? 0.5) * 100}% ${(photo?.focalY ?? 0.5) * 100}%` }}
            />
          </div>
          {!settings.ownerPhoto && detail ? (
            <figcaption className="cap">
              <span className="tick" aria-hidden="true" style={{ background: detail.pigment }} />
              No. {pieceRef(detail.id)}
              {detailKind ? `, ${detailKind}, in the studio` : ", in the studio"}
            </figcaption>
          ) : null}
        </figure>
      ) : null}
    </section>
  );
}
