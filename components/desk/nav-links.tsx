"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type Props = { prefix: string; links: ReadonlyArray<readonly [string, string]> };

export function DeskNavLinks({ prefix, links }: Props) {
  const raw = usePathname();
  const base = raw.startsWith(prefix) ? prefix : "/desk";
  const local = raw.startsWith(base) ? raw.slice(base.length) : raw;
  return (
    <nav className="desk-nav" aria-label="Desk">
      {links.map(([href, label]) => {
        const target = `${prefix}${href}`;
        const current = href === "" ? local === "" || local === "/" : local === href || local.startsWith(`${href}/`);
        return (
          <Link key={label} className={cn("desk-link")} href={target || "/"} aria-current={current ? "page" : undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
