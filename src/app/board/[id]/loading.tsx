export default function BoardLoading() {
  return (
    <main className="relative flex h-dvh w-full flex-col">
      <header className="border-foreground/10 flex items-center gap-4 border-b px-4 py-2">
        <div className="bg-foreground/10 h-4 w-16 animate-pulse rounded" />
        <div className="bg-foreground/10 h-4 w-40 animate-pulse rounded" />
      </header>
      <div className="bg-foreground/[0.02] text-foreground/40 flex flex-1 items-center justify-center text-sm">
        Loading board…
      </div>
    </main>
  );
}
