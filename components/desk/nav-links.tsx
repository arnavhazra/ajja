"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export type DeskNavSection = {
  title: string;
  links: ReadonlyArray<readonly [href: string, label: string, count?: number]>;
};

export function DeskNavLinks({ prefix, sections }: { prefix: string; sections: DeskNavSection[] }) {
  const raw = usePathname();
  const base = raw.startsWith(prefix) ? prefix : "/desk";
  const local = raw.startsWith(base) ? raw.slice(base.length) : raw;
  return (
    <nav className="desk-nav" aria-label="Desk">
      {sections.map((section) => (
        <div key={section.title} className="desk-nav-section">
          <p className="desk-nav-group">{section.title}</p>
          {section.links.map(([href, label, count]) => {
            const target = `${prefix}${href}`;
            const current = href === "" ? local === "" || local === "/" : local === href || local.startsWith(`${href}/`);
            return (
              <Link key={label} className={cn("desk-link")} href={target || "/"} aria-current={current ? "page" : undefined}>
                {label}
                {count ? (
                  <span className={cn("desk-badge", current && "desk-badge-current")}>{count > 99 ? "99+" : count}</span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
