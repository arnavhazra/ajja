import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { openNow, WEEKDAY_NAMES } from "@/lib/open-now";
import { getSettings } from "@/lib/public-data";
import { digits } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Visit" };

export default async function VisitPage() {
  const settings = await getSettings();
  const open = settings.hours.length ? (await connection(), openNow(settings.hours)) : null;
  const phone = digits(settings.phone);
  return (
    <main className="px-4 py-8 md:px-8">
      <div className="max-w-2xl">
        <header className="border-b border-line pb-6">
          <h1 className="text-4xl text-ink md:text-5xl">Visit</h1>
          <p className="measure mt-3 text-ink-soft">Studio visits by appointment or during open studio hours in Collegeville, Pennsylvania.</p>
        </header>
        <div className="mt-6">
          <p className="font-medium text-ink">
            {settings.town}, {settings.region}, {settings.country}
          </p>
          {settings.address ? (
            <p className="mt-1 text-ink-soft">{settings.address}</p>
          ) : (
            <p className="mt-2 text-ink-soft leading-relaxed">
              Private studio in {settings.town || "Collegeville"}, {settings.region || "Pennsylvania"}. Studio viewings are welcomed by appointment. Inquire below to arrange a visit.
            </p>
          )}
          {open != null ? (
            <p className="mt-3">{open ? "Open today." : "Closed today."}</p>
          ) : null}
          {settings.hours.length ? (
            <div className="mt-8 border-t border-line pt-6">
              <h2 className="text-2xl text-ink">Hours</h2>
              <ul className="mt-4 grid gap-1">
                {WEEKDAY_NAMES.map((day) => {
                  const row = settings.hours.find((entry) => entry.day === day);
                  return (
                    <li key={day} className="flex min-h-12 items-center justify-between gap-4 border-b border-line">
                      <span>{day}</span>
                      <span className="nums text-ink-soft">{row?.closed || !row?.open ? "Closed" : `${row.open}–${row.close}`}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            {settings.mapUrl ? (
              <a className="btn btn-primary" href={settings.mapUrl}>
                Open the map
              </a>
            ) : null}
            {phone ? (
              <a className="btn btn-secondary" href={`tel:${phone}`}>
                Call
              </a>
            ) : null}
            <Link className="btn btn-secondary" href="/#message">
              Inquire to visit
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
