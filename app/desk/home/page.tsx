import { Suspense } from "react";
import { PhotoChoice } from "@/components/desk/photo-choice";
import { DeskRowsSkeleton } from "@/components/desk/skeleton";
import { Flash, one } from "@/components/desk/flash";
import { removeTestimonial, saveHome, saveTestimonial } from "@/lib/desk-actions";
import { loadQuotes, requireDesk } from "@/lib/desk-data";
import { WEEKDAY_NAMES } from "@/lib/open-now";
import { getSettings, loadManifest } from "@/lib/public-data";

export default function HomeEditorPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<DeskRowsSkeleton />}>
      <HomeEditor searchParams={searchParams} />
    </Suspense>
  );
}

async function HomeEditor({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireDesk();
  const params = await searchParams;
  const [settings, quotes, manifest] = await Promise.all([getSettings(), loadQuotes(), loadManifest()]);
  const photos = [
    ...new Map(
      manifest.flatMap((piece) => piece.images.map((image) => [image.url, { url: image.url, label: piece.title.trim() || "Untitled photograph" }] as const)),
    ).values(),
  ];
  // The manifest only lists pieces on the site. Keep the currently saved
  // photographs selectable anyway so saving the page can't silently clear a
  // portrait or hero that belongs to a draft or an unlisted photo.
  for (const url of [settings.heroImage, settings.ownerPhoto]) {
    if (url && !photos.some((photo) => photo.url === url)) photos.push({ url, label: "Current photograph — not listed on the site" });
  }
  return (
    <main className="desk-page max-w-3xl">
      <Flash note={one(params.note)} undo="" back="/home" />
      <div className="desk-lead">
        <h1 className="text-4xl">Home page</h1>
        {settings.copyNeedsApproval ? <p className="desk-note">Needs your approval.</p> : <p className="desk-note">You marked this wording as approved.</p>}
      </div>
      <form action={saveHome} className="grid gap-3">
        <fieldset className="grid gap-3">
          <legend className="text-2xl">The name and words</legend>
          <label className="grid gap-1">
            Shop name
            <input className="field" name="businessName" defaultValue={settings.businessName} />
          </label>
          <label className="grid gap-1">
            Your name on the site
            <input className="field" name="ownerName" defaultValue={settings.ownerName} />
          </label>
          <label className="grid gap-1">
            Town
            <input className="field" name="town" defaultValue={settings.town} />
          </label>
          <label className="grid gap-1">
            State
            <input className="field" name="region" defaultValue={settings.region} />
          </label>
          <label className="grid gap-1">
            Headline
            <input className="field" name="heroHeadline" defaultValue={settings.heroHeadline} />
          </label>
          <label className="grid gap-1">
            Under the headline
            <textarea className="field" name="heroText" defaultValue={settings.heroText} />
          </label>
          <label className="grid gap-1">
            Story
            <textarea className="field" name="story" defaultValue={settings.story} />
          </label>
          <label className="grid gap-1">
            Announcement
            <input className="field" name="announcement" defaultValue={settings.announcement} />
          </label>
          <label className="flex min-h-12 items-center gap-3">
            <input type="checkbox" name="announcementLive" defaultChecked={settings.announcementLive} />
            Show the announcement
          </label>
        </fieldset>
        <fieldset className="grid gap-3">
          <legend className="text-2xl">Photographs</legend>
          <div className="grid gap-1">
            Hero photograph
            <PhotoChoice name="heroImage" current={settings.heroImage} photos={photos} noneLabel="No hero photograph" />
          </div>
          <input type="hidden" name="heroFocalX" value={String(settings.heroFocalX)} />
          <input type="hidden" name="heroFocalY" value={String(settings.heroFocalY)} />
          <div className="grid gap-1">
            Your photo
            <PhotoChoice name="ownerPhoto" current={settings.ownerPhoto} photos={photos} noneLabel="Not added yet" />
          </div>
        </fieldset>
        <fieldset className="grid gap-3">
          <legend className="text-2xl">Ways to reach you</legend>
          <label className="grid gap-1">
            WhatsApp number
            <input className="field" name="whatsapp" defaultValue={settings.whatsapp} />
          </label>
          <label className="grid gap-1">
            Phone
            <input className="field" name="phone" defaultValue={settings.phone} />
          </label>
          <label className="grid gap-1">
            Email for messages
            <input className="field" name="email" type="email" defaultValue={settings.email} />
          </label>
          <label className="grid gap-1">
            Street address
            <input className="field" name="address" defaultValue={settings.address} />
          </label>
          <label className="grid gap-1">
            Map link
            <input className="field" name="mapUrl" defaultValue={settings.mapUrl} />
          </label>
          <label className="grid gap-1">
            Instagram link
            <input className="field" name="instagram" defaultValue={settings.instagram} />
          </label>
          <label className="grid gap-1">
            Facebook link
            <input className="field" name="facebook" defaultValue={settings.facebook} />
          </label>
          <label className="grid gap-1">
            WhatsApp channel link
            <input className="field" name="whatsappChannel" defaultValue={settings.whatsappChannel} />
          </label>
          <label className="grid gap-1">
            How you reply
            <textarea className="field" name="responseNote" defaultValue={settings.responseNote} />
          </label>
        </fieldset>
        <fieldset className="grid gap-3">
          <legend className="text-2xl">Hours</legend>
          {WEEKDAY_NAMES.map((day) => {
            const row = settings.hours.find((entry) => entry.day === day);
            return (
              <div key={day} className="grid gap-2 md:grid-cols-[8rem_1fr_1fr_auto] md:items-center">
                <p>{day}</p>
                <input className="field" type="time" aria-label={`${day} opens`} name={`open-${day}`} defaultValue={row?.open ?? ""} />
                <input className="field" type="time" aria-label={`${day} closes`} name={`close-${day}`} defaultValue={row?.close ?? ""} />
                <label className="flex min-h-12 items-center gap-2">
                  <input type="checkbox" name={`closed-${day}`} defaultChecked={row?.closed ?? false} />
                  Closed
                </label>
              </div>
            );
          })}
        </fieldset>
        <fieldset className="grid gap-3">
          <legend className="text-2xl">Questions</legend>
          {settings.faqs.map((faq, index) => (
            <div key={`${faq.q}-${index}`} className="grid gap-2">
              <input className="field" name="faqQ" aria-label={`Question ${index + 1}`} defaultValue={faq.q} />
              <textarea className="field" name="faqA" aria-label={`Answer ${index + 1}`} defaultValue={faq.a} />
            </div>
          ))}
          <div className="grid gap-2">
            <input className="field" name="faqQ" aria-label="New question" placeholder="New question" />
            <textarea className="field" name="faqA" aria-label="New answer" placeholder="Answer" />
          </div>
        </fieldset>
        <fieldset className="grid gap-3">
          <legend className="text-2xl">Commissions &amp; timing</legend>
          <label className="grid gap-1">
            Lead times — how long a piece or a commission takes
            <textarea className="field" name="leadTime" defaultValue={settings.leadTime} />
          </label>
          <label className="grid gap-1">
            Holds — how long you keep a piece aside
            <textarea className="field" name="holds" defaultValue={settings.holds} />
          </label>
          <label className="grid gap-1">
            Custom work — what commissions you take on
            <textarea className="field" name="commissions" defaultValue={settings.commissions} />
          </label>
        </fieldset>
        <fieldset className="grid gap-3">
          <legend className="text-2xl">Terms shown on the site</legend>
          <label className="grid gap-1">
            Payment note
            <textarea className="field" name="paymentNote" defaultValue={settings.paymentNote} />
          </label>
          <label className="grid gap-1">
            Buying
            <textarea className="field" name="buying" defaultValue={settings.policies.buying} />
          </label>
          <label className="grid gap-1">
            Collection
            <textarea className="field" name="collection" defaultValue={settings.policies.collection} />
          </label>
          <label className="grid gap-1">
            Returns
            <textarea className="field" name="returns" defaultValue={settings.policies.returns} />
          </label>
        </fieldset>
        <input type="hidden" name="theme" value={settings.theme} />
        <input type="hidden" name="fontPair" value={settings.fontPair} />
        <label className="flex min-h-12 items-center gap-3">
          <input type="checkbox" name="approved" defaultChecked={!settings.copyNeedsApproval} />
          This wording is approved
        </label>
        <button className="btn btn-primary w-fit" type="submit">
          Save home page
        </button>
      </form>
      <section className="grid gap-4">
        <h2 className="text-3xl">Quotes</h2>
        <p>A quote stays off the site until you add who agreed and mark it ready.</p>
        <form action={saveTestimonial} className="grid gap-2">
          <label className="grid gap-1">
            Name
            <input className="field" name="name" />
          </label>
          <label className="grid gap-1">
            Words
            <textarea className="field" name="text" />
          </label>
          <label className="grid gap-1">
            Who agreed, and when
            <input className="field" name="consent" />
          </label>
          <label className="flex min-h-12 items-center gap-3">
            <input type="checkbox" name="publish" />
            Put this quote on the site
          </label>
          <button className="btn btn-secondary w-fit" type="submit">
            Save quote
          </button>
        </form>
        {quotes.map((quote) => (
          <form key={quote.id} action={saveTestimonial} className="grid gap-2 border-t border-line pt-4">
            <input type="hidden" name="id" value={quote.id} />
            <input className="field" name="name" defaultValue={quote.name} />
            <textarea className="field" name="text" defaultValue={quote.text} />
            <input className="field" name="consent" defaultValue={quote.consentNote} />
            <label className="flex min-h-12 items-center gap-3">
              <input type="checkbox" name="publish" defaultChecked={quote.status === "published"} />
              On the site
            </label>
            <div className="flex gap-2">
              <button className="btn btn-secondary" type="submit">
                Save quote
              </button>
              <button className="btn btn-quiet" type="submit" formAction={removeTestimonial}>
                Remove
              </button>
            </div>
          </form>
        ))}
      </section>
    </main>
  );
}
