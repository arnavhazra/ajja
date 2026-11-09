import Image from "next/image";
import { pieceKind, pieceRef } from "@/lib/piece-title";
import { pourData, pourOf } from "@/lib/pour";
import type { ShopSettings } from "@/lib/settings";
import type { PublicProduct } from "@/lib/types";

function Scrubbed({ text }: { text: string }) {
  return (
    <p className="pr-story" data-scrub-words="">
      {text.split(/\s+/).map((word, index) => (
        <span key={`${word}-${index}`} className="pr-word">
          {word}{" "}
        </span>
      ))}
    </p>
  );
}

/** The bench: a detail of one piece beside what the owner wrote about the studio. */
export function StudioIntro({ settings, detail }: { settings: ShopSettings; detail?: PublicProduct | null }) {
  // The bench block is only real bio + town — hide it entirely until the owner writes one.
  if (!settings.story.trim()) return null;
  const photoUrl = settings.ownerPhoto || detail?.images[0]?.url || "";
  const photo = settings.ownerPhoto ? detail?.images.find((image) => image.url === photoUrl) ?? detail?.images[0] : detail?.images[0];
  const photoAlt = settings.ownerPhoto ? `${settings.ownerName} in the studio` : (photo?.alt || "A piece from the studio");
  const detailKind = detail ? pieceKind(detail.categoryName, detail.attributes) : null;
  const ratio = photo?.width && photo?.height ? photo.width / photo.height : 4 / 5;
  const pour = pourOf(detail?.pigment, detail?.pigmentInk);

  return (
    <section
      id="studio"
      className="pr-section pr-bench shell scroll-mt-[60px]"
      aria-labelledby="studio-title"
      {...(detail ? pourData(pour) : {})}
    >
      <div className="pr-bench-copy">
        <p className="pr-label">From the bench</p>
        <h2 id="studio-title" className="pr-h2" data-reveal="">
          Made by hand in {settings.town}
        </h2>
        <Scrubbed text={settings.story} />
        <dl className="pr-facts">
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
        <figure className="pr-bench-media" style={{ "--ratio": ratio } as React.CSSProperties}>
          <div className="pr-photo">
            <div className="pr-photo-inner">
              <Image
                src={photoUrl}
                alt={photoAlt}
                fill
                sizes="(min-width: 960px) 36vw, 100vw"
                placeholder={photo?.blurData ? "blur" : "empty"}
                blurDataURL={photo?.blurData ?? undefined}
                className="object-cover"
                data-drift={detail ? 6 : 0}
                style={
                  detail
                    ? { objectPosition: `${(photo?.focalX ?? 0.5) * 100}% ${(photo?.focalY ?? 0.5) * 100}%` }
                    : undefined
                }
              />
            </div>
          </div>
          {detail ? (
            <figcaption className="pr-cap">
              <span className="pr-dot" aria-hidden="true" style={{ background: detail.pigment }} />
              No. {pieceRef(detail.id)}
              {detailKind ? `, ${detailKind}, in the studio` : ", in the studio"}
            </figcaption>
          ) : null}
        </figure>
      ) : null}
    </section>
  );
}
