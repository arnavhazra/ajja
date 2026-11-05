import { Suspense } from "react";
import Link from "next/link";
import { DeskRowsSkeleton } from "@/components/desk/skeleton";
import { approveEnhancedCovers } from "@/lib/desk-actions";
import { requireDesk } from "@/lib/desk-data";
import { deskPrefix } from "@/lib/desk-path";

export default function SettingsPage() {
  return (
    <Suspense fallback={<DeskRowsSkeleton />}>
      <Settings />
    </Suspense>
  );
}

async function Settings() {
  await requireDesk();
  const prefix = await deskPrefix();
  const links: [string, string][] = [
    ["/home", "Home page wording & contact"],
    ["/poster", "Poster"],
    ["/account", "Account & password"],
    ["/history", "History"],
    ["/help", "Help"],
    ["/add", "Add a piece"],
    ["/review", "Name & price sprint"],
  ];
  return (
    <main className="desk-page">
      <div className="desk-lead">
        <h1 className="text-4xl">Settings</h1>
        <p className="desk-note">Everything else lives here — the wording on the site, your account, and older tools.</p>
      </div>
      <ul className="desk-stack max-w-xl">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link className="ink-link inline-flex min-h-11 items-center text-lg" href={`${prefix}${href}`}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
      <form action={approveEnhancedCovers} className="mt-8">
        <button className="btn btn-secondary min-h-11 px-4" type="submit">
          Use tidied photos as covers everywhere
        </button>
      </form>
    </main>
  );
}
