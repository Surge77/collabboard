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
    <main className="dotgrid mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-hand text-coral -rotate-2 text-3xl">oops</p>
      <h1 className="text-foreground text-3xl font-extrabold tracking-tight">
        Something went wrong
      </h1>
      <p className="text-ink-soft text-sm">
        An unexpected error occurred. You can try again, or head back to your boards.
      </p>
      <div className="mt-2 flex gap-3">
        <button type="button" onClick={reset} className="btn btn-ink text-sm">
          Try again
        </button>
        <a href="/dashboard" className="btn btn-ghost text-sm">
          Back to boards
        </a>
      </div>
    </main>
  );
}
