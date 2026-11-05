import Link from "next/link";
import { DeskNavLinks, type DeskNavSection } from "@/components/desk/nav-links";
import { leaveDesk } from "@/lib/desk-actions";
import { loadNavCounts } from "@/lib/desk-data";
import { deskPrefix } from "@/lib/desk-path";

export async function DeskNav({ email }: { email: string }) {
  const [prefix, counts] = await Promise.all([deskPrefix(), loadNavCounts()]);
  const sections: DeskNavSection[] = [
    {
      title: "Desk",
      links: [
        ["", "Today"],
        ["/pieces", "Pieces"],
        ["/messages", "Messages", counts.waiting],
        ["/groups", "Groups"],
        ["/insights", "Numbers"],
        ["/files", "Files"],
        ["/settings", "Settings"],
      ],
    },
  ];
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
      <DeskNavLinks prefix={prefix} sections={sections} />
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
