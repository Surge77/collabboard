export default function BoardLoading() {
  return (
    <main className="relative flex h-dvh w-full flex-col">
      <header className="border-line bg-surface flex h-14 items-center gap-3 border-b px-4">
        <div className="bg-hover h-4 w-16 animate-pulse rounded" />
        <div className="bg-hover h-4 w-40 animate-pulse rounded" />
      </header>
      <div
        role="status"
        className="text-ink-soft bg-background flex flex-1 items-center justify-center text-sm"
      >
        Loading board…
      </div>
    </main>
  );
}
