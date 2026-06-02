'use client';

// SPIKE-ONLY demo route (spike/excalidraw-canvas branch). Renders the Excalidraw
// canvas without auth or Liveblocks so the engine can be eyeballed at
// http://localhost:3000/canvas-check. Delete before any merge.
import dynamic from 'next/dynamic';

const ExcalidrawCanvas = dynamic(
  () => import('@/components/board/excalidraw/ExcalidrawCanvas').then((m) => m.ExcalidrawCanvas),
  { ssr: false, loading: () => <div className="p-8 text-sm text-neutral-500">Loading canvas…</div> }
);

export default function CanvasCheckPage() {
  return (
    <main className="relative h-dvh w-full">
      <ExcalidrawCanvas boardId="spike-demo" canEdit />
    </main>
  );
}
