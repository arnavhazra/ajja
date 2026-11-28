import { Suspense } from "react";
import Link from "next/link";
import { DeskRowsSkeleton } from "@/components/desk/skeleton";
import { requireDesk } from "@/lib/desk-data";
import { deskPath } from "@/lib/desk-path";

export default function SettingsPage() {
  return (
    <Suspense fallback={<DeskRowsSkeleton />}>
      <Settings />
    </Suspense>
  );
}

async function Settings() {
  await requireDesk();
  const sections: { title: string; links: [string, string, string][] }[] = [
    {
      title: "The site",
      links: [
        ["/home", "Home page", "Wording, photographs, contact details, hours, and terms."],
        ["/poster", "Poster", "Print the shop QR code and piece stickers."],
      ],
    },
    {
      title: "Pieces",
      links: [
        ["/review", "Name & price sprint", "Finish drafts one piece at a time."],
        ["/groups", "Groups", "Labels like Paintings or Woodwork, plus hand-picked collections."],
      ],
    },
    {
      title: "Records",
      links: [
        ["/insights", "Numbers", "What people looked at and searched for."],
        ["/files", "Files", "Download the list, save a copy, or bring in a spreadsheet."],
        ["/history", "History", "What changed, in plain words."],
      ],
    },
    {
      title: "You",
      links: [
        ["/account", "Account", "Password and sign out."],
        ["/help", "Help", "The short guide and printable sheet."],
      ],
    },
  ];
  return (
    <main className="desk-page max-w-3xl">
      <div className="desk-lead">
        <h1 className="text-4xl">More</h1>
        <p className="desk-note">Everything beyond the three daily jobs lives here, grouped by what you want to do.</p>
      </div>
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="text-2xl">{section.title}</h2>
          <ul className="desk-settings-list">
            {section.links.map(([href, label, note]) => (
              <li key={href}>
                <Link className="desk-setting-link" href={`${deskPath}${href}`}>
                  <span>{label}</span>
                  <small>{note}</small>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
