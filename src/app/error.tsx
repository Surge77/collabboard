'use client';

import { useEffect } from 'react';

import { buttonClass } from '@/components/ui/Button';

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
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-start justify-center gap-3 px-4 py-16">
      <h1 className="text-foreground text-2xl font-semibold tracking-[-0.02em]">
        Something went wrong
      </h1>
      <p className="text-ink-soft text-sm leading-relaxed">
        This page hit an unexpected error. Try again; if it keeps happening, go back to your boards.
      </p>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={reset} className={buttonClass('primary')}>
          Try again
        </button>
        <a href="/dashboard" className={buttonClass('secondary')}>
          Back to boards
        </a>
      </div>
    </main>
  );
}
