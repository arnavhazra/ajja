export function DeskRowsSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="desk-page" aria-busy="true" aria-label="Loading">
      <div className="desk-skeleton h-10 w-48" />
      <div className="desk-skeleton h-11 w-full max-w-2xl" />
      <div className="grid gap-3">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="desk-skeleton size-5" />
            <div className="desk-skeleton size-13" />
            <div className="grid flex-1 gap-2">
              <div className="desk-skeleton h-4 w-1/2" />
              <div className="desk-skeleton h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
