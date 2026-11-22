import Link from "next/link";
import { DeskNavLinks, type DeskNavSection } from "@/components/desk/nav-links";
import { brand } from "@/lib/brand";
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
        ["/add", "Add a piece"],
        ["/pieces", "My pieces"],
        ["/messages", "Messages", counts.waiting],
        ["/help", "Help"],
      ],
    },
    {
      title: "More",
      links: [
        ["/review", "Review drafts"],
        ["/groups", "Groups"],
        ["/insights", "Numbers"],
        ["/files", "Files"],
        ["/history", "History"],
        ["/settings", "Settings"],
      ],
    },
  ];
  return (
    <header className="desk-side no-print">
      <div className="desk-bar">
        <p className="display text-3xl">
          {brand.name} <span className="desk-tag">Desk</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Link className="desk-link desk-view" href="/" target="_blank" rel="noreferrer">
            View the shop
          </Link>
          <form action={leaveDesk}>
            <button className="btn btn-quiet min-h-11 px-4 text-sm" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
      <DeskNavLinks prefix={prefix} sections={sections} />
      <div className="desk-foot">
        <p className="desk-signed-in truncate text-sm text-tar-soft">{email}</p>
      </div>
    </header>
  );
}
