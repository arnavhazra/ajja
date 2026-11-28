import { Suspense } from "react";
import { DeskRowsSkeleton } from "@/components/desk/skeleton";
import Link from "next/link";
import { Flash, one } from "@/components/desk/flash";
import { PasswordField } from "@/components/desk/password-field";
import { completePasswordSignIn, completeSignIn, completeStaffSignIn, sendSignInCode } from "@/lib/desk-actions/auth";
import { loadDashboard } from "@/lib/desk-data";
import { deskPath } from "@/lib/desk-path";
import { getSession } from "@/lib/auth";
import { brand } from "@/lib/brand";

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
    return (
      <main className="desk-signin grid min-h-[75vh] place-items-center px-4 py-10">
        <div className="w-full max-w-sm">
          <Flash note={note} undo="" back="/" />
          {tab === "staff" ? (
            <>
              <StaffForm />
              <p className="mt-6">
                <Link className="ink-link text-sm text-tar-soft" href="?">
                  ← Back to the usual sign in
                </Link>
              </p>
            </>
          ) : tab === "code" ? (
            <>
              <OwnerForm defaultEmail={one(params.email) ?? ""} />
              <p className="mt-6">
                <Link className="ink-link text-sm text-tar-soft" href="?">
                  ← Back to password sign in
                </Link>
              </p>
            </>
          ) : (
            <>
              <PasswordForm />
              {emailCodeReady ? (
                <p className="mt-5">
                  <Link className="ink-link text-sm text-tar-soft" href="?code=1">
                    Forgot password? Email me a sign-in code
                  </Link>
                </p>
              ) : null}
              {staffReady ? (
                <p className="mt-10">
                  <Link className="ink-link text-xs text-tar-soft" href="?staff=1">
                    Staff sign-in
                  </Link>
                </p>
              ) : null}
            </>
          )}
        </div>
      </main>
    );
  }
  const dash = await loadDashboard();
  return (
    <main className="desk-page">
      <Flash note={note} undo={one(params.undo)} back="/" />
      <div className="desk-lead">
        <h1 className="text-4xl">Today</h1>
        <p className="desk-note">Three jobs live here. Everything else is under More in the menu.</p>
      </div>
      <nav className="grid gap-3" aria-label="What would you like to do">
        <Link href={`${deskPath}/add`} className="desk-choice">
          <span className="display text-3xl">Add a piece</span>
          <span className="desk-choice-note">A photo starts a private draft — nothing goes on the site until you say so.</span>
        </Link>
        <Link href={`${deskPath}/pieces`} className="desk-choice">
          <span className="display text-3xl">My pieces</span>
          <span className="desk-choice-note">
            {dash.drafts ? `${dash.drafts} in draft` : "Nothing in draft"} · {dash.live} on the site
          </span>
        </Link>
        <Link href={`${deskPath}/messages`} className="desk-choice">
          <span className="display text-3xl">Messages</span>
          <span className="desk-choice-note">
            {dash.waiting
              ? `${dash.waiting} waiting${dash.waitingOldestDays > 0 ? ` — oldest is ${dash.waitingOldestDays} day${dash.waitingOldestDays === 1 ? "" : "s"} old` : ""}`
              : "No messages are waiting."}
          </span>
        </Link>
      </nav>
    </main>
  );
}

function PasswordForm() {
  return (
    <form action={completePasswordSignIn} className="grid gap-4">
      <p className="display text-5xl">{brand.name}</p>
      <h1 className="text-2xl font-[600]">Sign in to the desk</h1>
      <label className="grid gap-1.5">
        <span className="field-label">Email</span>
        <input className="field" name="email" type="email" autoComplete="username" required />
      </label>
      <PasswordField />
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
