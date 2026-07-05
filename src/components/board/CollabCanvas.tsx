'use client';

import 'tldraw/tldraw.css';
import { DefaultStylePanel, Tldraw } from 'tldraw';
import { useSelf } from '@liveblocks/react/suspense';

import { AiPanel } from '@/components/board/AiPanel';
import { Avatars } from '@/components/board/Avatars';
import { ColorToggle } from '@/components/board/ColorToggle';
import { ExportMenu } from '@/components/board/ExportMenu';
import { Reactions } from '@/components/board/Reactions';
import { useYjsStore } from '@/components/board/useYjsStore';

// Undefined on localhost is fine — tldraw only enforces a license at production
// runtime. The Hobby key is added at deploy time.
const licenseKey = process.env.NEXT_PUBLIC_TLDRAW_LICENSE_KEY;

interface CollabCanvasProps {
  boardId: string;
  canEdit: boolean;
}

export function CollabCanvas({ boardId, canEdit }: CollabCanvasProps) {
  // Selectors (not bare useSelf) avoid re-rendering on every presence change.
  const id = useSelf((me) => me.id);
  const info = useSelf((me) => me.info);

  const store = useYjsStore({
    user: { id, color: info.color, name: info.name },
    canEdit,
  });

  return (
    <div className="absolute inset-0">
      <Tldraw
        store={store}
        licenseKey={licenseKey}
        autoFocus
        onMount={(editor) => {
          // Public viewers (non-owners) get a read-only canvas.
          if (!canEdit) editor.updateInstanceState({ isReadonly: true });
          // Test-only handle for the sync E2E to read the scene. Gated by an
          // env flag so it never ships in a normal build.
          if (process.env.NEXT_PUBLIC_E2E_HOOKS === '1') {
            (window as unknown as { __tlEditor?: typeof editor }).__tlEditor = editor;
          }
        }}
        components={{
          StylePanel: () => (
            <div className="flex flex-col gap-1">
              <Avatars />
              <DefaultStylePanel />
            </div>
          ),
        }}
      >
        {canEdit ? <AiPanel boardId={boardId} /> : null}
        {canEdit ? <ColorToggle /> : null}
        {/* Export is available to viewers too: read access implies the right to
            export what you can already see. Fully client-side, no server call. */}
        <ExportMenu />
        {/* Ephemeral emotes — everyone in the room can react, including viewers. */}
        <Reactions />
      </Tldraw>
    </div>
  );
}
