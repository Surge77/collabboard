import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { Canvas } from '@/components/board/Canvas';
import { ShareDialog } from '@/components/board/ShareDialog';
import { auth } from '@/lib/auth';
import { getViewableBoard } from '@/lib/boards';
import { boardRoomId } from '@/lib/liveblocks';

interface BoardPageProps {
  params: Promise<{ id: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const session = await auth();
  // Defense in depth alongside the proxy's authorized callback.
  if (!session?.user?.id) redirect('/login');

  const { id } = await params;
  const viewable = await getViewableBoard(id, session.user.id);
  if (!viewable) notFound();

  const { board, role } = viewable;
  const canEdit = role === 'owner';

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
          {canEdit ? <ShareDialog boardId={board.id} initialIsPublic={board.isPublic} /> : null}
        </div>
      </header>
      <div className="relative isolate flex-1">
        {/* Each board maps to its own Liveblocks room; the auth endpoint grants
            the owner edit access and public viewers read-only access. */}
        <Canvas roomId={boardRoomId(board.id)} boardId={board.id} canEdit={canEdit} />
      </div>
    </main>
  );
}
