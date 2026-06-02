import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { Canvas } from '@/components/board/Canvas';
import { auth } from '@/lib/auth';
import { getBoard } from '@/lib/boards';

interface BoardPageProps {
  params: Promise<{ id: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const session = await auth();
  // Defense in depth alongside the proxy's authorized callback.
  if (!session?.user?.id) redirect('/login');

  const { id } = await params;
  const board = await getBoard(id, session.user.id);
  if (!board) notFound();

  return (
    <main className="relative flex h-dvh w-full flex-col">
      <header className="border-foreground/10 flex items-center gap-4 border-b px-4 py-2">
        <Link
          href="/dashboard"
          className="text-foreground/60 hover:text-foreground text-sm font-medium"
        >
          ← Boards
        </Link>
        <h1 className="truncate text-sm font-semibold">{board.title}</h1>
      </header>
      <div className="relative flex-1">
        {/* Namespaced persistence key keeps each board's local IndexedDB store
            isolated; Liveblocks replaces this with a shared store in Phase 3. */}
        <Canvas persistenceKey={`collabboard-${board.id}`} />
      </div>
    </main>
  );
}
