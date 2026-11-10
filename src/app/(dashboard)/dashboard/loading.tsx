const SKELETON_ROWS = 5;

// Mirrors the real page: same header height, width and row shape, so nothing
// jumps when the boards arrive.
export default function DashboardLoading() {
  return (
    <div className="flex min-h-full flex-col" role="status" aria-label="Loading boards">
      <div className="border-line bg-surface h-14 border-b" />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="bg-hover h-7 w-28 animate-pulse rounded" />
        <div className="flex items-center justify-between gap-2">
          <div className="bg-hover h-9 w-full max-w-xs animate-pulse rounded-md" />
          <div className="bg-hover h-9 w-28 animate-pulse rounded-md" />
        </div>
        <ul className="border-line bg-surface overflow-hidden rounded-lg border">
          {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
            <li
              key={i}
              className="border-line flex h-14 items-center gap-3 border-b px-3 last:border-b-0"
            >
              <div className="bg-hover h-8 w-8 animate-pulse rounded" />
              <div className="bg-hover h-4 w-48 animate-pulse rounded" />
              <div className="bg-hover ml-auto h-3 w-20 animate-pulse rounded" />
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
