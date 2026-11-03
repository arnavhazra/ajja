import Link from "next/link";
import { DeskNavLinks } from "@/components/desk/nav-links";
import { leaveDesk } from "@/lib/desk-actions";
import { deskPrefix } from "@/lib/desk-path";

const LINKS = [
  ["", "Today"],
  ["/pieces", "Pieces"],
  ["/add", "Add a piece"],
  ["/review", "Review"],
  ["/groups", "Groups"],
  ["/home", "Home page"],
  ["/messages", "Messages"],
  ["/insights", "How it's going"],
  ["/files", "Bring in / Save a copy"],
  ["/poster", "Poster"],
  ["/history", "Change history"],
  ["/account", "Account"],
] as const;

export async function DeskNav({ email }: { email: string }) {
  const prefix = await deskPrefix();
  return (
    <header className="desk-side no-print">
      <div className="desk-bar">
        <p className="display text-3xl">
          Ajja<span className="text-cobalt">.</span> <span className="desk-tag">Desk</span>
        </p>
        <Link className="desk-link desk-view" href="/" target="_blank" rel="noreferrer">
          View the shop
        </Link>
      </div>
      <DeskNavLinks prefix={prefix} links={LINKS} />
      <div className="desk-foot">
        <p className="desk-signed-in truncate text-sm text-ink-soft">{email}</p>
        <div className="flex flex-wrap gap-2">
          <Link className="btn btn-secondary min-h-11 px-4 text-sm" href={`${prefix}/help`}>
            Help
          </Link>
          <form action={leaveDesk}>
            <button className="btn btn-quiet min-h-11 px-4 text-sm" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
