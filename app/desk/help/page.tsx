import { Suspense } from "react";
import Link from "next/link";
import { requireDesk } from "@/lib/desk-data";
import { deskPrefix } from "@/lib/desk-path";

export default function HelpPage() {
  return (
    <Suspense fallback={<p className="p-4">Loading…</p>}>
      <Help />
    </Suspense>
  );
}

async function Help() {
  await requireDesk();
  const prefix = await deskPrefix();
  return (
    <main className="desk-page max-w-3xl">
      <div className="desk-lead">
        <h1 className="text-4xl">Help</h1>
      </div>
      <section>
        <p className="desk-note">Add a piece from a photo. It stays a draft until you write a name and a price and choose On the site.</p>
        <p className="desk-note">Mark sold when it has gone. Hide takes it off the shop without deleting it. Trash keeps it for 30 days.</p>
        <p className="desk-note">Undo sits next to the note after you save. Sign out is at the top.</p>
        <p className="desk-note">Phone and WhatsApp buttons appear on the shop only after you type a real number.</p>
        <Link className="btn btn-primary w-fit" href={`${prefix}/help/print`}>
          Open the one-page sheet
        </Link>
      </section>
    </main>
  );
}
