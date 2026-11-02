import { Suspense } from "react";
import { DeskNav } from "@/components/desk/nav";
import { getSession } from "@/lib/auth";
import "./desk.css";

export const metadata = { robots: { index: false, follow: false }, title: "Desk" };

export default function DeskLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-4">Loading…</p>}>
      <DeskFrame>{children}</DeskFrame>
    </Suspense>
  );
}

async function DeskFrame({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) return <div className="desk min-h-dvh bg-paper">{children}</div>;
  return (
    <div className="desk min-h-dvh bg-paper">
      <DeskNav email={session.email} />
      <div className="px-4 py-6">{children}</div>
    </div>
  );
}
