import type { Metadata } from "next";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { getSettings } from "@/lib/public-data";

export const metadata: Metadata = { title: "Our story" };

export default async function AboutPage() {
  const settings = await getSettings();
  return (
    <main
      className={cn(
        "grid gap-10 px-4 py-8 md:items-start md:px-8 md:py-12",
        settings.ownerPhoto ? "md:grid-cols-[1.15fr_0.85fr]" : "max-w-3xl",
      )}
    >
      <div>
        <h1 className="text-4xl text-ink md:text-5xl">Our story</h1>
        <p className="measure mt-6 text-lg leading-relaxed">{settings.story}</p>
        <p className="measure mt-6 border-t border-line pt-6 text-ink-soft">{settings.paymentNote}</p>
      </div>
      {settings.ownerPhoto ? (
        <div className="photo-frame crop relative" style={{ position: "relative" }}>
          <Image
            src={settings.ownerPhoto}
            alt={`${settings.ownerName} at the studio`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 40vw"
          />
        </div>
      ) : null}
    </main>
  );
}
