import Image from "next/image";
import { pieceKind, pieceRef } from "@/lib/piece-title";
import type { ShopSettings } from "@/lib/settings";
import type { PublicProduct } from "@/lib/types";

export function StudioIntro({ settings, detail }: { settings: ShopSettings; detail?: PublicProduct | null }) {
  // The bench block is only real bio + town — hide it entirely until the owner writes one.
  if (!settings.story.trim()) return null;
  const photoUrl = settings.ownerPhoto || detail?.images[0]?.url || "";
  const photoAlt = settings.ownerPhoto ? `${settings.ownerName} in the studio` : (detail?.images[0]?.alt || "A piece from the studio");
  const detailKind = detail ? pieceKind(detail.categoryName, detail.attributes) : null;

  return (
    <section id="studio" className="hairline-b scroll-mt-[78px]">
      <div className={photoUrl ? "shell bench" : "shell pb-[clamp(36px,6vh,64px)]"}>
        <div>
          <p className="kicker">from the bench — {settings.town}, {settings.region}</p>
          <h2 className="disp mt-[10px]">
            Made by hand <span className="sten">in</span> {settings.town}.
          </h2>
          <p className="story prose">{settings.story}</p>
          <div className="honesty">
            <div>
              <b>photographed as it is</b>
              <span>What you see on this site is the piece itself, in the studio. No staging, no stock photographs.</span>
            </div>
            <div>
              <b>ask first</b>
              <span>{settings.paymentNote}</span>
            </div>
          </div>
        </div>

        {photoUrl ? (
          <figure className="bench-photo">
            <div className="ph relative overflow-hidden">
              <Image
                src={photoUrl}
                alt={photoAlt}
                fill
                sizes="(min-width: 900px) 42vw, 100vw"
                className="object-cover"
                style={
                  detail
                    ? { objectPosition: `${(detail.images[0]?.focalX ?? 0.5) * 100}% ${(detail.images[0]?.focalY ?? 0.5) * 100}%` }
                    : undefined
                }
              />
            </div>
            {detail ? (
              <figcaption className="cap type">
                <span className="tick" aria-hidden="true" style={{ background: detail.pigment }} />
                no. {pieceRef(detail.id)}
                {detailKind ? ` — ${detailKind}, in the studio` : ", in the studio"}
              </figcaption>
            ) : null}
          </figure>
        ) : null}
      </div>
    </section>
  );
}
