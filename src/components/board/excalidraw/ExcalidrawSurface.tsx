'use client';

import '@excalidraw/excalidraw/index.css';
import { useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';

import { ExcalidrawAiPanel } from '@/components/board/excalidraw/ExcalidrawAiPanel';
import { ExcalidrawApiProvider } from '@/components/board/excalidraw/ExcalidrawApiContext';
import { ExcalidrawExportMenu } from '@/components/board/excalidraw/ExcalidrawExportMenu';

type ChangeHandler = NonNullable<Parameters<typeof Excalidraw>[0]['onChange']>;
type PointerHandler = NonNullable<Parameters<typeof Excalidraw>[0]['onPointerUpdate']>;

interface ExcalidrawSurfaceProps {
  boardId: string;
  canEdit: boolean;
  onApi?: (api: ExcalidrawImperativeAPI) => void;
  onChange?: ChangeHandler;
  onPointerUpdate?: PointerHandler;
}

// Presentational canvas with no Liveblocks dependency, so it can render both
// inside a room (collab wrapper supplies the sync handlers) and standalone
// (e.g. the /canvas-check demo). All realtime wiring lives in the parent.
export function ExcalidrawSurface({
  boardId,
  canEdit,
  onApi,
  onChange,
  onPointerUpdate,
}: ExcalidrawSurfaceProps) {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);

  return (
    <div className="absolute inset-0">
      <Excalidraw
        viewModeEnabled={!canEdit}
        excalidrawAPI={(instance) => {
          // Test-only handle for the sync E2E to read the scene. Gated by an
          // env flag so it never ships in a normal build.
          if (process.env.NEXT_PUBLIC_E2E_HOOKS === '1') {
            (window as unknown as { __exApi?: ExcalidrawImperativeAPI }).__exApi = instance;
          }
          setApi(instance);
          onApi?.(instance);
        }}
        onChange={onChange}
        onPointerUpdate={onPointerUpdate}
      />
      {api ? (
        <ExcalidrawApiProvider value={api}>
          {canEdit ? <ExcalidrawAiPanel boardId={boardId} /> : null}
          <ExcalidrawExportMenu />
        </ExcalidrawApiProvider>
      ) : null}
    </div>
  );
}
