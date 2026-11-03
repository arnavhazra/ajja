import { EnquiryForm } from "@/components/enquiry-form";
import type { ShopSettings } from "@/lib/settings";
import { digits } from "@/lib/whatsapp";

export function VisitSection({ settings }: { settings: ShopSettings }) {
  const hours = settings.hours.filter((day) => day.closed || (day.open && day.close));
  return (
    <section id="visit" aria-labelledby="visit-title" className="scroll-mt-20 bg-plate py-24 md:py-36">
      <div className="shell grid gap-14 md:grid-cols-12 md:gap-6">
        <div className="md:col-span-5">
          <h2 id="visit-title" className="display text-[clamp(2.75rem,6vw,5.5rem)]">
            Ask about a piece
          </h2>
          <p className="prose-serif measure mt-6 text-ink-soft">
            {settings.responseNote || "Send a note about any piece, a price, or a studio visit, and you will hear back directly."}
          </p>
          <dl className="mt-10 grid gap-5">
            <div>
              <dt className="caption">Studio</dt>
              <dd className="mt-1 text-lg">
                {settings.address || `${settings.town}, ${settings.region}`}
                <a href={settings.mapUrl} target="_blank" rel="noopener" className="ink-link ml-3 text-base text-ink-soft">
                  Map
                </a>
              </dd>
            </div>
            {settings.email ? (
              <div>
                <dt className="caption">Email</dt>
                <dd className="mt-1 text-lg">
                  <a className="ink-link break-all" href={`mailto:${settings.email}`}>
                    {settings.email}
                  </a>
                </dd>
              </div>
            ) : null}
            {settings.phone ? (
              <div>
                <dt className="caption">Phone</dt>
                <dd className="mt-1 text-lg">
                  <a className="ink-link" href={`tel:${digits(settings.phone)}`}>
                    {settings.phone}
                  </a>
                </dd>
              </div>
            ) : null}
            {hours.length ? (
              <div>
                <dt className="caption">Hours</dt>
                <dd className="mt-1 grid gap-1">
                  {hours.map((day) => (
                    <span key={day.day} className="nums flex justify-between gap-6 border-b border-line py-1 sm:max-w-sm">
                      <span>{day.day}</span>
                      <span className="text-ink-soft">{day.closed ? "Closed" : `${day.open}–${day.close}`}</span>
                    </span>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
        <div className="md:col-span-6 md:col-start-7">
          <EnquiryForm />
        </div>
      </div>
    </section>
  );
}
