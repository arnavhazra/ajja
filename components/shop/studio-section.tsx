import Image from "next/image";
import type { ShopSettings } from "@/lib/settings";
import type { PublicProduct } from "@/lib/types";

type Props = { settings: ShopSettings; detail: PublicProduct | null };

export function StudioSection({ settings, detail }: Props) {
  const words = settings.story.split(/\s+/).filter(Boolean);
  const photo = settings.ownerPhoto || detail?.images[1]?.url || detail?.images[0]?.url || "";
  const photoAlt = settings.ownerPhoto ? `${settings.ownerName} in the studio` : (detail?.images[0]?.alt ?? "Detail of a painting");
  return (
    <section id="studio" aria-labelledby="studio-title" className="scroll-mt-20 bg-night py-24 text-gesso md:py-36">
      <div className="shell grid gap-14 md:grid-cols-12 md:gap-6">
        <div className="md:col-span-4">
          <h2 id="studio-title" className="display text-[clamp(3rem,7vw,6.5rem)]">
            The studio
          </h2>
          {photo ? (
            <div className="relative mt-10 aspect-[4/5] w-full max-w-sm overflow-hidden rounded-[2px] bg-gesso/5">
              <div data-drift="14" className="absolute -inset-y-[8%] inset-x-0">
                <Image src={photo} alt={photoAlt} fill sizes="(min-width: 768px) 30vw, 90vw" className="object-cover" />
              </div>
            </div>
          ) : null}
        </div>
        <div className="md:col-span-7 md:col-start-6">
          <p data-scrub-words="" className="display-wide text-[clamp(1.75rem,3.6vw,3.25rem)] leading-[1.12]">
            <span className="sr-only">{settings.story}</span>
            {words.map((word, index) => (
              <span key={`${word}-${index}`} data-word="" aria-hidden="true">
                {word}{" "}
              </span>
            ))}
          </p>
          <dl className="mt-14 grid gap-6 border-t border-gesso/15 pt-8 sm:grid-cols-2">
            <div>
              <dt className="caption text-gesso/60">Where</dt>
              <dd className="mt-1 text-lg">
                {settings.town}, {settings.region}
              </dd>
            </div>
            <div>
              <dt className="caption text-gesso/60">Payment</dt>
              <dd className="mt-1 text-lg">{settings.paymentNote}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
