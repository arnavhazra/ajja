import { Suspense } from "react";
import { DeskRowsSkeleton } from "@/components/desk/skeleton";
import Image from "next/image";
import Link from "next/link";
import { Flash, one } from "@/components/desk/flash";
import { completePasswordSignIn, completeSignIn, completeStaffSignIn, sendSignInCode, toggleChecklist } from "@/lib/desk-actions";
import { loadDashboard } from "@/lib/desk-data";
import { deskPrefix } from "@/lib/desk-path";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/public-data";
import { isOlderThanDays } from "@/lib/time";
import { pieceTitle } from "@/lib/piece-title";

export default function DeskHome({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<DeskRowsSkeleton />}>
      <Home searchParams={searchParams} />
    </Suspense>
  );
}

async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const session = await getSession();
  const note = one(params.note);
  if (!session) {
    const emailCodeReady = Boolean(process.env.OWNER_EMAIL && process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
    const staffReady = Boolean(process.env.DEV_ADMIN_EMAIL && process.env.DEV_ADMIN_PASSWORD && process.env.DEV_ADMIN_TOTP_SECRET);
    const tab = one(params.staff) === "1" ? "staff" : one(params.code) === "1" ? "code" : "password";
    const tabClass = (key: string) =>
      `tag inline-flex min-h-11 items-center rounded-[2px] px-4 ${
        tab === key ? "bg-tar font-bold text-wall" : "hairline-box text-tar-soft hover:text-tar"
      }`;
    return (
      <main className="desk-signin grid min-h-[75vh] place-items-center px-4 py-10">
        <div className="w-full max-w-sm">
          <Flash note={note} undo="" back="/" />
          <nav className="mb-6 flex flex-wrap gap-2" aria-label="Sign in methods">
            <Link className={tabClass("password")} aria-current={tab === "password" ? "true" : undefined} href="?">
              Password
            </Link>
            {emailCodeReady ? (
              <Link className={tabClass("code")} aria-current={tab === "code" ? "true" : undefined} href="?code=1">
                Email code
              </Link>
            ) : null}
            {staffReady ? (
              <Link className={tabClass("staff")} aria-current={tab === "staff" ? "true" : undefined} href="?staff=1">
                Staff app code
              </Link>
            ) : null}
          </nav>
          {tab === "staff" ? <StaffForm /> : tab === "code" ? <OwnerForm defaultEmail={one(params.email) ?? ""} /> : <PasswordForm />}
        </div>
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
        <h2 className="text-2xl">Next up</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <NextCard href={`${prefix}/pieces?need=title`} count={dash.needsName} label="Needs a name" empty="Every piece has a name." />
          <NextCard href={`${prefix}/pieces?need=price`} count={dash.needsPrice} label="Needs a price" empty="Every piece has a price." />
          <NextCard
            href={`${prefix}/messages?status=new`}
            count={dash.waiting}
            label="Messages waiting"
            extra={dash.waitingOldestDays > 0 ? `oldest is ${dash.waitingOldestDays} day${dash.waitingOldestDays === 1 ? "" : "s"} old` : undefined}
            empty="No messages are waiting."
          />
          <NextCard href={`${prefix}/review`} count={dash.sprint} label="Name & price sprint" extra={dash.sprint ? `${dash.sprint} to go` : "queue is clear"} empty="Nothing needs a name or a price." />
        </div>
        {backupOld ? <p className="desk-note">It has been a month since the last saved copy — save one from Files.</p> : null}
      </section>
      <section>
        <h2 className="text-2xl">Views this week</h2>
        <Sparkline points={dash.sparkline.map((p) => p.count)} labels={dash.sparkline.map((p) => p.day)} />
      </section>
      <section>
        <h2 className="text-2xl">Most looked at this week</h2>
        {dash.top.length ? (
          <ul className="grid gap-2">
            {dash.top.map((item) => (
              <li key={item.slug}>
                <Link href={`${prefix}/pieces/${item.id}`} className="flex items-center gap-3">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt="" width={44} height={44} className="size-11 rounded-[2px] border border-line object-cover" />
                  ) : (
                    <span className="grid size-11 place-items-center rounded-[2px] border border-line bg-wall-deep text-tar-soft">?</span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate">{pieceTitle(item.title, null, item.attributes ?? {}, item.id)}</span>
                    <span className="nums text-sm text-tar-soft">{item.count} views</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="desk-note">No views yet — share the site and check back.</p>
        )}
      </section>
      <section className="grid gap-3">
        <h2 className="text-2xl">First steps</h2>
        <ul className="grid gap-2">
          <CheckItem prefix={prefix} label="Read the homepage wording" href="/home" done={Boolean(settings.checklist.wording)} itemKey="wording" />
          <CheckItem prefix={prefix} label="Add a photo to start a piece" href="/add" done={dash.drafts + dash.live > 0} itemKey="photo" />
          <CheckItem prefix={prefix} label="Write a price before a piece goes on the site" href="/pieces" done={dash.missing === 0 && dash.live > 0} itemKey="price" />
          <CheckItem prefix={prefix} label="Add a phone or WhatsApp number" href="/account" done={Boolean(settings.phone || settings.whatsapp)} itemKey="phone" />
        </ul>
      </section>
      <Link className="btn btn-primary w-fit" href={`${prefix}/review`}>
        Start the name &amp; price sprint
      </Link>
    </main>
  );
}

function NextCard({ href, count, label, extra, empty }: { href: string; count: number; label: string; extra?: string; empty: string }) {
  return (
    <Link href={href} className="hairline-box grid gap-1 bg-wall p-4 transition-colors hover:bg-wall-deep">
      <span className="display text-4xl nums">{count}</span>
      <span className="tag">{label}{extra ? ` — ${extra}` : ""}</span>
      <span className="caption text-sm">{count > 0 ? "Tap to open the list." : empty}</span>
    </Link>
  );
}

function Sparkline({ points, labels }: { points: number[]; labels: string[] }) {
  const max = Math.max(1, ...points);
  const w = 140;
  const h = 32;
  const step = points.length > 1 ? w / (points.length - 1) : w;
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - (p / max) * (h - 2)).toFixed(1)}`).join(" ");
  const total = points.reduce((a, b) => a + b, 0);
  return (
    <figure className="grid w-72 gap-0.5">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={`Views over the last 7 days: ${points.join(", ")}, ${total} total`}
        className="h-14 w-full"
      >
        <path d={d} fill="none" stroke="var(--sap)" strokeWidth="1.5" />
      </svg>
      <figcaption className="flex justify-between tag">
        <span>{labels[0]?.slice(5)}</span>
        <span>{labels[labels.length - 1]?.slice(5)}</span>
      </figcaption>
    </figure>
  );
}

function CheckItem({ prefix, label, href, done, itemKey }: { prefix: string; label: string; href: string; done: boolean; itemKey: string }) {
  return (
    <li>
      <form action={toggleChecklist} className="flex items-center justify-between gap-3 border-b border-line pb-2">
        <Link className={`inline-flex min-h-11 items-center ${done ? "text-tar-soft line-through" : ""}`} href={`${prefix}${href}`}>
          {label}
        </Link>
        <input type="hidden" name="key" value={itemKey} />
        <input type="hidden" name="done" value={done ? "off" : "on"} />
        <button className={`btn min-h-11 px-3 text-xs ${done ? "btn-quiet text-ok" : "btn-secondary"}`} type="submit" aria-pressed={done}>
          {done ? "✓ Done" : "Mark done"}
        </button>
      </form>
    </li>
  );
}

function PasswordForm() {
  return (
    <form action={completePasswordSignIn} className="grid gap-4">
      <p className="display text-5xl">Ajja</p>
      <h1 className="text-2xl font-[600]">Sign in to the desk</h1>
      <label className="grid gap-1.5">
        <span className="field-label">Email</span>
        <input className="field" name="email" type="email" autoComplete="username" required />
      </label>
      <label className="grid gap-1.5">
        <span className="field-label">Password</span>
        <input className="field" name="password" type="password" autoComplete="current-password" required />
      </label>
      <button className="btn btn-primary" type="submit">
        Sign in
      </button>
    </form>
  );
}

function OwnerForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  return (
    <>
      <form action={sendSignInCode} className="grid gap-3">
        <h1 className="text-4xl">Sign in</h1>
        <p className="desk-note">Use the email address for this shop. A 6-digit code will arrive if that address is allowed.</p>
        <label className="grid gap-1">
          Email
          <input className="field" name="email" type="email" autoComplete="username" defaultValue={defaultEmail} required />
        </label>
        <button className="btn btn-primary" type="submit">
          Email me a code
        </button>
      </form>
      <form action={completeSignIn} className="grid gap-3">
        <label className="grid gap-1">
          Email
          <input className="field" name="email" type="email" autoComplete="username" defaultValue={defaultEmail} required />
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
