import Link from 'next/link';

import { auth } from '@/lib/auth';

export default async function LandingPage() {
  const session = await auth();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
      <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">CollabBoard</h1>
      <p className="text-foreground/70 max-w-xl text-lg">
        A real-time collaborative whiteboard with an AI copilot. Draw together on an infinite
        canvas, generate diagrams from a prompt, and summarize your board in a click.
      </p>
      <div className="flex gap-4">
        <Link
          href={session ? '/dashboard' : '/login'}
          className="bg-foreground text-background rounded-full px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
        >
          {session ? 'Go to dashboard' : 'Get started'}
        </Link>
      </div>
    </main>
  );
}
