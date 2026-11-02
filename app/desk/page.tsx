import { Suspense } from "react";
import Link from "next/link";
import { Flash, one } from "@/components/desk/flash";
import { completeSignIn, completeStaffSignIn, sendSignInCode, toggleChecklist } from "@/lib/desk-actions";
import { loadDashboard } from "@/lib/desk-data";
import { deskPrefix } from "@/lib/desk-path";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/public-data";
import { isOlderThanDays } from "@/lib/time";

export default function DeskHome({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<p className="p-4">Loading…</p>}>
      <Home searchParams={searchParams} />
    </Suspense>
  );
}

async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const session = await getSession();
  const note = one(params.note);
  if (!session) {
    return (
      <main className="desk-page mx-auto max-w-md px-4 py-10">
        <Flash note={note} undo="" back="/" />
        {one(params.staff) === "1" ? <StaffForm /> : <OwnerForm />}
      </main>
    );
  }
  const [dash, settings, prefix] = await Promise.all([loadDashboard(), getSettings(), deskPrefix()]);
  const backupOld = isOlderThanDays(settings.lastBackupAt, 30);
  return (
    <main className="desk-page">
      <Flash note={note} undo={one(params.undo)} back="/" />
      <div className="desk-lead">
        <h1 className="text-4xl">Today</h1>
        {settings.copyNeedsApproval ? <p className="desk-note">Homepage wording needs your approval.</p> : null}
      </div>
      <section>
        <p>Live pieces: {dash.live}. Drafts: {dash.drafts}. Messages waiting: {dash.waiting}.</p>
        <p>
          This week: {dash.whatsapp} WhatsApp taps, {dash.calls} calls.
        </p>
        <p>{dash.missing ? `${dash.missing} pieces are missing a photo or a price.` : "Every listed piece has a photo and a price."}</p>
        {backupOld ? <p>It has been a month since the last saved copy. Save a copy from Bring in / Save a copy.</p> : <p>A copy was saved recently.</p>}
      </section>
      <section>
        <h2 className="text-2xl">Most looked at this week</h2>
        {dash.top.length ? (
          <ul>
            {dash.top.map((item) => (
              <li key={item.slug}>
                {item.title}: {item.count}
              </li>
            ))}
          </ul>
        ) : (
          <p>No views yet.</p>
        )}
      </section>
      <section className="grid gap-3">
        <h2 className="text-2xl">First steps</h2>
        <CheckItem prefix={prefix} label="Read the homepage wording" href="/home" done={Boolean(settings.checklist.wording)} itemKey="wording" />
        <p>{dash.drafts + dash.live > 0 ? "A photo is in the desk." : "Add a photo to start a piece."}</p>
        <p>{dash.missing === 0 && dash.live > 0 ? "Prices are filled in on live pieces." : "Write a price before a piece goes on the site."}</p>
        <p>{settings.phone || settings.whatsapp ? "A phone or WhatsApp number is saved." : "Add a phone or WhatsApp number when you have one."}</p>
      </section>
      <Link className="btn btn-primary w-fit" href={`${prefix}/review`}>
        Review drafts
      </Link>
    </main>
  );
}

function CheckItem({ prefix, label, href, done, itemKey }: { prefix: string; label: string; href: string; done: boolean; itemKey: string }) {
  return (
    <form action={toggleChecklist} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="key" value={itemKey} />
      <input type="hidden" name="done" value={done ? "off" : "on"} />
      <button className="btn btn-quiet" type="submit">
        {done ? "Done" : "Mark done"}
      </button>
      <Link className="inline-flex min-h-12 items-center" href={`${prefix}${href}`}>
        {label}
      </Link>
    </form>
  );
}

function OwnerForm() {
  return (
    <>
      <form action={sendSignInCode} className="grid gap-3">
        <h1 className="text-4xl">Sign in</h1>
        <p className="desk-note">Use the email address for this shop. A 6-digit code will arrive if that address is allowed.</p>
        <label className="grid gap-1">
          Email
          <input className="field" name="email" type="email" autoComplete="username" required />
        </label>
        <button className="btn btn-primary" type="submit">
          Email me a code
        </button>
      </form>
      <form action={completeSignIn} className="grid gap-3">
        <label className="grid gap-1">
          Email
          <input className="field" name="email" type="email" autoComplete="username" required />
        </label>
        <label className="grid gap-1">
          Code
          <input className="field" name="code" inputMode="numeric" autoComplete="one-time-code" required />
        </label>
        <button className="btn btn-secondary" type="submit">
          Sign in
        </button>
      </form>
    </>
  );
}

function StaffForm() {
  return (
    <form action={completeStaffSignIn} className="grid gap-3">
      <h1 className="text-4xl">Staff sign in</h1>
      <label className="grid gap-1">
        Email
        <input className="field" name="email" type="email" autoComplete="username" required />
      </label>
      <label className="grid gap-1">
        Password
        <input className="field" name="password" type="password" autoComplete="current-password" required />
      </label>
      <label className="grid gap-1">
        Code from your app
        <input className="field" name="token" inputMode="numeric" autoComplete="one-time-code" required />
      </label>
      <button className="btn btn-primary" type="submit">
        Sign in
      </button>
    </form>
  );
}
