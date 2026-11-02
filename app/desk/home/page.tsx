import { Suspense } from "react";
import { Flash, one } from "@/components/desk/flash";
import { removeTestimonial, saveHome, saveTestimonial } from "@/lib/desk-actions";
import { loadQuotes, requireDesk } from "@/lib/desk-data";
import { WEEKDAY_NAMES } from "@/lib/open-now";
import { getSettings, loadStudio } from "@/lib/public-data";

export default function HomeEditorPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<p className="p-4">Loading…</p>}>
      <HomeEditor searchParams={searchParams} />
    </Suspense>
  );
}

async function HomeEditor({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireDesk();
  const params = await searchParams;
  const [settings, quotes, studio] = await Promise.all([getSettings(), loadQuotes(), loadStudio()]);
  const photos = studio.flatMap((piece) => piece.images.map((image) => ({ url: image.url, label: piece.title.trim() || "Untitled photograph" })));
  return (
    <main className="desk-page max-w-3xl">
      <Flash note={one(params.note)} undo="" back="/home" />
      <div className="desk-lead">
        <h1 className="text-4xl">Home page</h1>
        {settings.copyNeedsApproval ? <p className="desk-note">Needs your approval.</p> : <p className="desk-note">You marked this wording as approved.</p>}
      </div>
      <form action={saveHome} className="grid gap-3">
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
        <label className="grid gap-1">
          Hero photograph
          <select className="field" name="heroImage" defaultValue={settings.heroImage}>
            <option value="">No photograph yet</option>
            {photos.map((photo) => (
              <option key={photo.url} value={photo.url}>
                {photo.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          Hero focus across, 0 to 1
          <input className="field" name="heroFocalX" defaultValue={String(settings.heroFocalX)} />
        </label>
        <label className="grid gap-1">
          Hero focus down, 0 to 1
          <input className="field" name="heroFocalY" defaultValue={String(settings.heroFocalY)} />
        </label>
        <label className="grid gap-1">
          Your photo
          <select className="field" name="ownerPhoto" defaultValue={settings.ownerPhoto}>
            <option value="">Not added yet</option>
            {photos.map((photo) => (
              <option key={`owner-${photo.url}`} value={photo.url}>
                {photo.label}
              </option>
            ))}
          </select>
        </label>
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
        <label className="grid gap-1">
          Payment note
          <textarea className="field" name="paymentNote" defaultValue={settings.paymentNote} />
        </label>
        <fieldset className="grid gap-3">
          <legend className="text-2xl">Hours</legend>
          {WEEKDAY_NAMES.map((day) => {
            const row = settings.hours.find((entry) => entry.day === day);
            return (
              <div key={day} className="grid gap-2 md:grid-cols-[8rem_1fr_1fr_auto] md:items-center">
                <p>{day}</p>
                <input className="field" type="time" name={`open-${day}`} defaultValue={row?.open ?? ""} />
                <input className="field" type="time" name={`close-${day}`} defaultValue={row?.close ?? ""} />
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
              <input className="field" name="faqQ" defaultValue={faq.q} />
              <textarea className="field" name="faqA" defaultValue={faq.a} />
            </div>
          ))}
          <div className="grid gap-2">
            <input className="field" name="faqQ" placeholder="New question" />
            <textarea className="field" name="faqA" placeholder="Answer" />
          </div>
        </fieldset>
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
        <label className="grid gap-1">
          Theme
          <select className="field" name="theme" defaultValue={settings.theme}>
            <option value="walnut">Walnut</option>
            <option value="clay">Clay</option>
            <option value="ink">Ink</option>
          </select>
        </label>
        <label className="grid gap-1">
          Headings
          <select className="field" name="fontPair" defaultValue={settings.fontPair}>
            <option value="fraunces">Spectral</option>
            <option value="newsreader">Newsreader</option>
          </select>
        </label>
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
