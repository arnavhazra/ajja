import type { Metadata } from "next";
import Image from "next/image";
import { getSettings } from "@/lib/public-data";

export const metadata: Metadata = { title: "Our story" };

export default async function AboutPage() {
  const settings = await getSettings();
  return (
    <main className="grid gap-10 px-4 py-8 md:grid-cols-[1.15fr_0.85fr] md:items-start md:px-8 md:py-12">
      <div>
        <h1 className="text-4xl text-ink md:text-5xl">Our story</h1>
        <p className="measure mt-6">{settings.story}</p>
        <p className="measure mt-6 border-t border-line pt-6">{settings.paymentNote}</p>
      </div>
      {settings.ownerPhoto ? (
        <div className="photo-frame crop relative">
          <Image src={settings.ownerPhoto} alt={`${settings.ownerName} at the studio`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 40vw" />
        </div>
      ) : (
        <div className="photo-frame crop relative grid place-items-center p-6 text-center text-ink-soft">
          <p>A photo of Ajja will go here when he adds one.</p>
        </div>
      )}
    </main>
  );
}
