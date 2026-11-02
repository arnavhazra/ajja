import { Suspense } from "react";
import { Flash, one } from "@/components/desk/flash";
import { saveRetention, setEnquiryStatus } from "@/lib/desk-actions";
import { loadMessages, requireDesk } from "@/lib/desk-data";
import { getSettings } from "@/lib/public-data";
import { digits, whatsAppHref } from "@/lib/whatsapp";

export default function MessagesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<p className="p-4">Loading…</p>}>
      <Messages searchParams={searchParams} />
    </Suspense>
  );
}

async function Messages({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireDesk();
  const params = await searchParams;
  const status = one(params.status);
  const [rows, settings] = await Promise.all([loadMessages(status), getSettings()]);
  return (
    <main className="desk-page">
      <Flash note={one(params.note)} undo="" back="/messages" />
      <div className="desk-lead">
        <h1 className="text-4xl">Messages</h1>
        <p className="desk-note">New, replied, or closed. Old messages are deleted after the number of days you set.</p>
      </div>
      <nav className="flex flex-wrap gap-2" aria-label="Message status">
        <a className="btn btn-quiet" href="?">
          All
        </a>
        <a className="btn btn-quiet" href="?status=new">
          New
        </a>
        <a className="btn btn-quiet" href="?status=replied">
          Replied
        </a>
        <a className="btn btn-quiet" href="?status=closed">
          Closed
        </a>
        <a className="btn btn-secondary" href="/api/desk/messages">
          Export
        </a>
      </nav>
      <div className="desk-stack">
        {rows.length === 0 ? <p>No messages in this list.</p> : null}
        {rows.map((row) => {
          const phone = digits(row.contact);
          const href = phone.length >= 10 ? whatsAppHref(phone, `Hello ${row.name}, this is ${settings.businessName}.`) : "";
          return (
            <article key={row.id} className="grid gap-2 border-b border-line pb-4">
              <h2 className="text-2xl">{row.name}</h2>
              <p>{row.contact}</p>
              <p>{row.message}</p>
              {row.giftNote ? <p>Gift note: {row.giftNote}</p> : null}
              {row.quantity ? <p>Quantity: {row.quantity}</p> : null}
              {row.bulk ? <p>Asked about a bulk price.</p> : null}
              <p>{row.status}</p>
              <div className="flex flex-wrap gap-2">
                {href ? (
                  <a className="btn btn-primary" href={href}>
                    Reply on WhatsApp
                  </a>
                ) : null}
                <form action={setEnquiryStatus}>
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="status" value="replied" />
                  <button className="btn btn-secondary" type="submit">
                    Mark replied
                  </button>
                </form>
                <form action={setEnquiryStatus}>
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="status" value="closed" />
                  <button className="btn btn-quiet" type="submit">
                    Close
                  </button>
                </form>
                <form action={setEnquiryStatus}>
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="status" value="new" />
                  <button className="btn btn-quiet" type="submit">
                    Mark new
                  </button>
                </form>
              </div>
            </article>
          );
        })}
      </div>
      <form action={saveRetention} className="grid max-w-sm gap-2">
        <label className="grid gap-1">
          Keep messages for this many days
          <input className="field" name="days" inputMode="numeric" defaultValue={String(settings.enquiryRetentionDays)} />
        </label>
        <button className="btn btn-secondary w-fit" type="submit">
          Save
        </button>
      </form>
    </main>
  );
}
