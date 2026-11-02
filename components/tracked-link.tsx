"use client";

export function TrackedLink({
  href,
  type,
  className,
  children,
}: {
  href: string;
  type: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      className={className}
      href={href}
      onClick={() => {
        void fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, path: location.pathname }),
        });
      }}
    >
      {children}
    </a>
  );
}
