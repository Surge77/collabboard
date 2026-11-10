import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { Canvas } from '@/components/board/Canvas';
import { ShareDialog } from '@/components/board/ShareDialog';
import { Icon } from '@/components/ui/Icon';
import { auth } from '@/lib/auth';
import { canEditRole, isAdminRole, resolveBoardAccess } from '@/lib/authz';
import { boardRoomId } from '@/lib/liveblocks';

// Strip the Referer header so a `?t=<token>` share link is never leaked to
// third-party URLs the user navigates to from within a board.
export const metadata: Metadata = { referrer: 'no-referrer' };

interface BoardPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}

export default async function BoardPage({ params, searchParams }: BoardPageProps) {
  const { id } = await params;
  const { t: shareToken } = await searchParams;
  const session = await auth();
  // Defense in depth alongside the proxy's authorized callback. Carry the board
  // (and invite token) through sign-in so the user lands back here.
  if (!session?.user?.id) {
    const back = `/board/${id}${shareToken ? `?t=${encodeURIComponent(shareToken)}` : ''}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(back)}`);
  }
  const access = await resolveBoardAccess(id, session.user.id, shareToken);
  if (!access) notFound();

  const { board, role } = access;
  const canEdit = canEditRole(role);
  const isAdmin = isAdminRole(role);

  return (
    <main className="relative flex h-dvh w-full flex-col">
      {/* Right padding keeps the free-plan Liveblocks badge (fixed top-right)
          from covering Share. */}
      <header className="border-line bg-surface relative z-50 flex h-14 shrink-0 items-center gap-3 border-b pr-24 pl-2 sm:pr-36">
        <Link
          href="/dashboard"
          className="text-ink-soft hover:bg-hover hover:text-foreground flex h-9 items-center gap-1 rounded-md px-2 text-sm font-medium transition-colors duration-150"
        >
          <Icon name="back" size={16} />
          Boards
        </Link>
        <span className="bg-line h-5 w-px" aria-hidden="true" />
        <h1 className="text-foreground min-w-0 truncate text-sm font-semibold">{board.title}</h1>
        {!canEdit ? (
          <span className="border-line-strong text-ink-soft shrink-0 rounded border px-1.5 py-0.5 text-xs font-medium">
            View only
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          {isAdmin ? <ShareDialog boardId={board.id} initialIsPublic={board.isPublic} /> : null}
        </div>
      </header>
      <div className="relative isolate flex-1">
        {/* Each board maps to its own Liveblocks room; the auth endpoint grants
            edit access to admins and editors, read-only to everyone else with
            access. The share token (if any) is forwarded so the realtime token
            matches the page's access decision. */}
        <Canvas
          roomId={boardRoomId(board.id)}
          boardId={board.id}
          role={role}
          shareToken={shareToken}
        />
      </div>
    </main>
  );
}
