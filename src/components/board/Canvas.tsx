'use client';

import dynamic from 'next/dynamic';

interface CanvasProps {
  persistenceKey: string;
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

// tldraw touches window/document on first render, so it cannot be server-rendered.
// next/dynamic with ssr:false defers it to the client and lazy-loads its heavy
// bundle behind the skeleton.
const BoardCanvas = dynamic(
  () => import('@/components/board/BoardCanvas').then((m) => m.BoardCanvas),
  { ssr: false, loading: () => <CanvasSkeleton /> }
);

export function Canvas({ persistenceKey }: CanvasProps) {
  return <BoardCanvas persistenceKey={persistenceKey} />;
}
