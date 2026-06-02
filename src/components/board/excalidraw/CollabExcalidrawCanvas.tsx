'use client';

import { useState } from 'react';
import { useSelf } from '@liveblocks/react/suspense';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';

import { ExcalidrawSurface } from '@/components/board/excalidraw/ExcalidrawSurface';
import { useExcalidrawSync } from '@/components/board/excalidraw/useExcalidrawSync';

interface CollabExcalidrawCanvasProps {
  boardId: string;
  canEdit: boolean;
}

// Connects the presentational surface to the Liveblocks room: pulls the local
// user from presence, runs the Yjs <-> Excalidraw sync, and feeds its handlers
// back into the surface.
export function CollabExcalidrawCanvas({ boardId, canEdit }: CollabExcalidrawCanvasProps) {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const id = useSelf((me) => me.id);
  const info = useSelf((me) => me.info);

  const { onChange, onPointerUpdate } = useExcalidrawSync({
    api,
    user: { id, color: info.color, name: info.name },
    canEdit,
  });

  return (
    <ExcalidrawSurface
      boardId={boardId}
      canEdit={canEdit}
      onApi={setApi}
      onChange={onChange}
      onPointerUpdate={onPointerUpdate}
    />
  );
}
