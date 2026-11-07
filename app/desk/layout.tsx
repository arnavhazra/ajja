import { Suspense } from "react";
import { DeskNav } from "@/components/desk/nav";
import { DeskRowsSkeleton } from "@/components/desk/skeleton";
import { getSession } from "@/lib/auth";
import "./desk.css";

export const metadata = { robots: { index: false, follow: false }, title: "Desk" };

export default function DeskLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <main className="p-4">
          <DeskRowsSkeleton rows={6} />
        </main>
      }
    >
      <DeskFrame>{children}</DeskFrame>
    </Suspense>
  );
}

async function DeskFrame({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) return <div id="content" className="desk min-h-dvh bg-wall">{children}</div>;
  return (
    <div className="desk desk-shell min-h-dvh bg-wall">
      <DeskNav email={session.email} />
      <div id="content" className="desk-main">{children}</div>
    </div>
  );
}
