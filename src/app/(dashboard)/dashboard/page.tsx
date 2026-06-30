import { redirect } from 'next/navigation';

import { BoardList } from '@/components/board/BoardList';
import { Wordmark } from '@/components/site/Wordmark';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
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
    <div className="flex min-h-full flex-col">
      <div className="border-line border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Wordmark />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/' });
              }}
            >
              <button type="submit" className="btn btn-ghost !px-4 !py-2 text-sm">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
        <header>
          <p className="font-hand text-accent -rotate-1 text-2xl">hi {name}</p>
          <h1 className="text-foreground text-4xl font-extrabold tracking-tight">Your boards</h1>
        </header>

        <BoardList initialBoards={boards} />
      </main>
    </div>
  );
}
