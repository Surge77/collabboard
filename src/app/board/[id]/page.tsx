import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { Canvas } from '@/components/board/Canvas';
import { ShareDialog } from '@/components/board/ShareDialog';
import { auth } from '@/lib/auth';
import { canEditRole, resolveBoardAccess } from '@/lib/authz';
import { boardRoomId } from '@/lib/liveblocks';

// Strip the Referer header so a `?t=<token>` share link is never leaked to
// third-party URLs the user navigates to from within a board.
export const metadata: Metadata = { referrer: 'no-referrer' };

interface BoardPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}

export default async function BoardPage({ params, searchParams }: BoardPageProps) {
  const session = await auth();
  // Defense in depth alongside the proxy's authorized callback.
  if (!session?.user?.id) redirect('/login');

  const { id } = await params;
  const { t: shareToken } = await searchParams;
  const access = await resolveBoardAccess(id, session.user.id, shareToken);
  if (!access) notFound();

  const { board, role } = access;
  const canEdit = canEditRole(role);
  const isOwner = role === 'owner';

  return (
    <main className="relative flex h-dvh w-full flex-col">
      <header className="border-foreground/10 bg-background relative z-50 flex items-center gap-4 border-b px-4 py-2">
        <Link
          href="/dashboard"
          className="text-foreground/60 hover:text-foreground text-sm font-medium"
        >
          ← Boards
        </Link>
        <h1 className="truncate text-sm font-semibold">{board.title}</h1>
        {!canEdit ? (
          <span className="text-foreground/50 border-foreground/15 rounded-full border px-2 py-0.5 text-xs">
            View only
          </span>
        ) : null}
        <div className="ml-auto">
          {isOwner ? <ShareDialog boardId={board.id} initialIsPublic={board.isPublic} /> : null}
        </div>
      </header>
      <div className="relative isolate flex-1">
        {/* Each board maps to its own Liveblocks room; the auth endpoint grants
            edit access to the owner and share-link editors, read-only to everyone
            else with access. The share token (if any) is forwarded so the realtime
            token matches the page's access decision. */}
        <Canvas
          roomId={boardRoomId(board.id)}
          boardId={board.id}
          canEdit={canEdit}
          shareToken={shareToken}
        />
      </div>
    </main>
  );
}
