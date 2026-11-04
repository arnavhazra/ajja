import Image from "next/image";
import type { ShopSettings } from "@/lib/settings";
import type { PublicProduct } from "@/lib/types";

export function StudioIntro({ settings, detail }: { settings: ShopSettings; detail?: PublicProduct | null }) {
  const photoUrl = settings.ownerPhoto || detail?.images[0]?.url || "";
  const photoAlt = settings.ownerPhoto ? `${settings.ownerName} in the studio` : (detail?.images[0]?.alt || "A piece from the studio");

  return (
    <section id="studio" className="py-16 sm:py-24 hairline-b bg-linen">
      <div className="shell grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        <div className="lg:col-span-6">
          <div className="bg-bone p-4 sm:p-6 hairline-box rounded-sm shadow-sm">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-ink">
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt={photoAlt}
                  fill
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="object-cover grayscale contrast-125 brightness-95 hover:scale-105 transition-transform duration-1000"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-ink/10 pointer-events-none" />
            </div>

            <div className="pt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-umber">
              <span>From the bench</span>
              <span>{settings.town}, {settings.region}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 lg:pl-4">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-6 h-[1px] bg-terracotta" />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-terracotta font-bold">
              The studio
            </span>
          </div>

          <h2 className="font-serif text-4xl sm:text-5xl text-ink font-normal leading-[1.12] mb-6">
            Made by hand in {settings.town}.
          </h2>

          <div className="space-y-4 text-sm sm:text-base text-umber leading-[1.75] mb-10 font-sans">
            <p>{settings.story}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 hairline-t hairline-b mb-8">
            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-ink font-bold mb-1.5">
                Photographed as it is
              </h3>
              <p className="text-xs text-umber leading-relaxed font-sans">
                What you see on this site is the piece itself, in the studio. No staging, no stock photographs.
              </p>
            </div>
            <div>
              <h3 className="font-mono text-xs uppercase tracking-widest text-ink font-bold mb-1.5">
                Ask first
              </h3>
              <p className="text-xs text-umber leading-relaxed font-sans">
                {settings.paymentNote}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
