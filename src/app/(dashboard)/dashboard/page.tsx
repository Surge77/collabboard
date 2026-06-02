import { redirect } from 'next/navigation';

import { BoardList } from '@/components/board/BoardList';
import { auth, signOut } from '@/lib/auth';
import { listBoards } from '@/lib/boards';

export default async function DashboardPage() {
  const session = await auth();
  // Defense in depth: the proxy gates this route, but server components must not
  // trust it as the sole guard (a misconfigured matcher must never leak data).
  if (!session?.user?.id) redirect('/login');

  const name = session.user.name ?? session.user.email ?? 'there';
  const boards = await listBoards(session.user.id);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your boards</h1>
          <p className="text-foreground/60 text-sm">Signed in as {name}</p>
        </div>
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/' });
          }}
        >
          <button
            type="submit"
            className="border-foreground/15 hover:bg-foreground/5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
          >
            Sign out
          </button>
        </form>
      </header>

      <BoardList initialBoards={boards} />
    </main>
  );
}
