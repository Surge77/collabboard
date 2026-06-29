import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="dotgrid mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-hand text-accent -rotate-3 text-7xl">404</p>
      <h1 className="text-foreground text-3xl font-extrabold tracking-tight">Page not found</h1>
      <p className="text-ink-soft text-sm">
        This board doesn’t exist, isn’t shared with you, or the link is wrong.
      </p>
      <Link href="/dashboard" className="btn btn-ink mt-2 text-sm">
        Back to boards
      </Link>
    </main>
  );
}
