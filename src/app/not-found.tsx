import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-foreground/40 text-5xl font-bold">404</p>
      <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="text-foreground/60 text-sm">
        This board doesn’t exist, isn’t shared with you, or the link is wrong.
      </p>
      <Link
        href="/dashboard"
        className="bg-foreground text-background rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
      >
        Back to boards
      </Link>
    </main>
  );
}
