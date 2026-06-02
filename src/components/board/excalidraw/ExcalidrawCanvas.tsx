'use client';

import '@excalidraw/excalidraw/index.css';
import { useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';

import { ExcalidrawApiProvider } from '@/components/board/excalidraw/ExcalidrawApiContext';
import { ExcalidrawExportMenu } from '@/components/board/excalidraw/ExcalidrawExportMenu';

interface ExcalidrawCanvasProps {
  boardId: string;
  canEdit: boolean;
}

export function ExcalidrawCanvas({ boardId: _boardId, canEdit }: ExcalidrawCanvasProps) {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);

  return (
    <div className="absolute inset-0">
      <Excalidraw viewModeEnabled={!canEdit} excalidrawAPI={(instance) => setApi(instance)} />
      {api ? (
        <ExcalidrawApiProvider value={api}>
          <ExcalidrawExportMenu />
        </ExcalidrawApiProvider>
      ) : null}
    </div>
  );
}
