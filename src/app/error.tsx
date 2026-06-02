'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
      <p className="text-foreground/60 text-sm">
        An unexpected error occurred. You can try again, or head back to your boards.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="bg-foreground text-background rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="border-foreground/15 hover:bg-foreground/5 rounded-lg border px-4 py-2 text-sm font-medium"
        >
          Back to boards
        </a>
      </div>
    </main>
  );
}
