export default function DashboardLoading() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="bg-foreground/10 h-7 w-40 animate-pulse rounded" />
          <div className="bg-foreground/10 h-4 w-56 animate-pulse rounded" />
        </div>
        <div className="bg-foreground/10 h-9 w-28 animate-pulse rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-foreground/10 h-28 animate-pulse rounded-xl border" />
        ))}
      </div>
    </main>
  );
}
