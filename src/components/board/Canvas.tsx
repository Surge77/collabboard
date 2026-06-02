'use client';

import dynamic from 'next/dynamic';

interface CanvasProps {
  roomId: string;
  boardId: string;
}

function CanvasSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading canvas"
      className="bg-foreground/[0.02] text-foreground/40 absolute inset-0 flex items-center justify-center text-sm"
    >
      Loading canvas…
    </div>
  );
}

// The Liveblocks room + tldraw both touch window/document, so they cannot be
// server-rendered. ssr:false defers the whole realtime canvas to the client and
// lazy-loads its heavy bundle behind the skeleton.
const Room = dynamic(() => import('@/components/board/Room').then((m) => m.Room), {
  ssr: false,
  loading: () => <CanvasSkeleton />,
});

export function Canvas({ roomId, boardId }: CanvasProps) {
  return <Room roomId={roomId} boardId={boardId} />;
}
