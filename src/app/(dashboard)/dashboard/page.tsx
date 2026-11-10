import { redirect } from 'next/navigation';

import { BoardList } from '@/components/board/BoardList';
import { SiteHeader } from '@/components/site/SiteHeader';
import { buttonClass } from '@/components/ui/Button';
import { auth, signOut } from '@/lib/auth';
import { listBoards } from '@/lib/boards';

export default async function DashboardPage() {
  const session = await auth();
  // Defense in depth: the proxy gates this route, but server components must not
  // trust it as the sole guard (a misconfigured matcher must never leak data).
  if (!session?.user?.id) redirect('/login');

  const accountLabel = session.user.email ?? session.user.name ?? 'Signed in';
  const boards = await listBoards(session.user.id);

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader
        action={
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/' });
            }}
            className="flex items-center gap-2"
          >
            <span className="text-ink-soft hidden max-w-48 truncate text-[13px] sm:inline">
              {accountLabel}
            </span>
            <button type="submit" className={buttonClass('secondary', 'sm')}>
              Sign out
            </button>
          </form>
        }
      />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-foreground text-2xl font-semibold tracking-[-0.02em]">Boards</h1>
        <BoardList initialBoards={boards} />
      </main>
    </div>
  );
}
