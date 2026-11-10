import Link from 'next/link';

import { buttonClass } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-start justify-center gap-3 px-4 py-16">
      <p className="text-ink-soft text-sm font-medium tabular-nums">404</p>
      <h1 className="text-foreground text-2xl font-semibold tracking-[-0.02em]">Board not found</h1>
      <p className="text-ink-soft text-sm leading-relaxed">
        This board doesn’t exist, isn’t shared with you, or the link is wrong. Ask the owner for a
        new invite link.
      </p>
      <Link href="/dashboard" className={`${buttonClass('primary')} mt-2`}>
        Back to boards
      </Link>
    </main>
  );
}
