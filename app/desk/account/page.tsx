import { Suspense } from "react";
import { DeskRowsSkeleton } from "@/components/desk/skeleton";
import { Flash, one } from "@/components/desk/flash";
import { requireDesk } from "@/lib/desk-data";
import { leaveDesk, updatePassword } from "@/lib/desk-actions";

export default function AccountPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<DeskRowsSkeleton />}>
      <Account searchParams={searchParams} />
    </Suspense>
  );
}

async function Account({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [session, params] = await Promise.all([requireDesk(), searchParams]);
  return (
    <main className="desk-page max-w-xl">
      <Flash note={one(params.note)} undo="" back="/account" />
      <div>
        <h1 className="text-4xl">Account</h1>
        <p className="desk-note">Signed in as {session.email}.</p>
      </div>
      <form action={leaveDesk}>
        <button className="btn btn-secondary" type="submit">
          Sign out
        </button>
      </form>
      <form action={updatePassword} className="grid gap-4">
        <h2 className="text-2xl">Change password</h2>
        <label className="grid gap-1.5">
          <span className="field-label">Current password</span>
          <input className="field" name="current" type="password" autoComplete="current-password" />
          <span className="field-hint">Leave empty if you have never set one.</span>
        </label>
        <label className="grid gap-1.5">
          <span className="field-label">New password</span>
          <input className="field" name="next" type="password" autoComplete="new-password" minLength={12} required />
          <span className="field-hint">At least 12 characters.</span>
        </label>
        <label className="grid gap-1.5">
          <span className="field-label">New password again</span>
          <input className="field" name="confirm" type="password" autoComplete="new-password" minLength={12} required />
        </label>
        <button className="btn btn-primary justify-self-start" type="submit">
          Save password
        </button>
      </form>
    </main>
  );
}
