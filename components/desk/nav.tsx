import Link from "next/link";
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
];

export async function DeskNav({ email }: { email: string }) {
  const prefix = await deskPrefix();
  return (
    <header className="no-print">
      <div className="desk-top">
        <div className="desk-bar">
          <p className="display text-3xl">Desk</p>
          <div className="flex flex-wrap items-center gap-2">
            <Link className="btn btn-secondary" href={`${prefix}/help`}>
              Help
            </Link>
            <form action={leaveDesk}>
              <button className="btn btn-quiet" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <p className="desk-signed-in text-ink-soft">{email}</p>
      </div>
      <nav className="desk-nav" aria-label="Desk">
        {LINKS.map(([href, label]) => (
          <Link key={label} className="btn btn-quiet" href={`${prefix}${href}`}>
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
