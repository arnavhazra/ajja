import Image from "next/image";
import { Suspense } from "react";
import QRCode from "qrcode";
import { PrintButton } from "@/components/desk/print-button";
import { loadPosterPieces, requireDesk } from "@/lib/desk-data";
import { getSettings } from "@/lib/public-data";
import { siteUrl } from "@/lib/site-url";

export default function PosterPage() {
  return (
    <Suspense fallback={<p className="p-4">Loading…</p>}>
      <Poster />
    </Suspense>
  );
}

async function Poster() {
  await requireDesk();
  const [settings, pieces] = await Promise.all([getSettings(), loadPosterPieces()]);
  const home = await QRCode.toDataURL(siteUrl(), { margin: 1, width: 480 });
  const stickers = await Promise.all(
    pieces.map(async (piece) => ({
      title: piece.title.trim() || "Title not written yet",
      src: await QRCode.toDataURL(`${siteUrl()}/p/${piece.slug}`, { margin: 1, width: 240 }),
    })),
  );
  return (
    <main className="desk-page">
      <div className="desk-lead no-print">
        <h1 className="text-4xl">Poster</h1>
        <p className="desk-note">Print an A4 poster, or a sheet of stickers for pieces that are on the site.</p>
        <PrintButton />
      </div>
      <section className="grid min-h-[70dvh] place-items-center gap-4 border border-line p-8">
        <p className="display text-5xl">{settings.businessName}</p>
        <p>
          {settings.town}, {settings.region}
        </p>
        <Image src={home} alt={`QR code for ${settings.businessName}`} width={320} height={320} unoptimized />
      </section>
      <section className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {stickers.length === 0 ? <p>No pieces are on the site yet, so there are no stickers.</p> : null}
        {stickers.map((sticker) => (
          <article key={sticker.title} className="grid place-items-center gap-2 border border-line p-3">
            <Image src={sticker.src} alt="" width={160} height={160} unoptimized />
            <p>{sticker.title}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
