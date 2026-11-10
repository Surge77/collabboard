'use client';

import 'tldraw/tldraw.css';
import { useSelf } from '@liveblocks/react/suspense';
import { useRef, useState, type ReactNode } from 'react';
import {
  CenteredTopPanelContainer,
  EditorProvider,
  OfflineIndicator,
  Tldraw,
  useCollaborationStatus,
  type Editor,
  type TLComponents,
} from 'tldraw';

import { AiPanel } from '@/components/board/AiPanel';
import { BoardRail } from '@/components/board/BoardRail';
import {
  BoardUiContext,
  type BoardUi,
  type CommentDraft,
  type PanelId,
} from '@/components/board/board-ui';
import { Comments } from '@/components/board/Comments';
import { CommentsPanel } from '@/components/board/CommentsPanel';
import { CursorChat } from '@/components/board/CursorChat';
import { DockPanel } from '@/components/board/DockPanel';
import { ExportMenu } from '@/components/board/ExportMenu';
import { FacilitatePanel } from '@/components/board/FacilitatePanel';
import { Reactions } from '@/components/board/Reactions';
import { TimerChip } from '@/components/board/TimerChip';
import { useComments } from '@/components/board/useComments';
import { useReactions, useTimer, useVotes } from '@/components/board/useFacilitation';
import { useTldrawColorScheme } from '@/components/board/useTldrawColorScheme';
import { useYjsStore } from '@/components/board/useYjsStore';
import { VersionHistory } from '@/components/board/VersionHistory';
import { canCommentRole, canEditRole } from '@/lib/board-roles';
import type { BoardRole } from '@/types/board';

// Undefined on localhost is fine — tldraw only enforces a license at production
// runtime. The Hobby key is added at deploy time.
const licenseKey = process.env.NEXT_PUBLIC_TLDRAW_LICENSE_KEY;

// tldraw's top-centre slot. CenteredTopPanelContainer must be the slot's root:
// it measures its grandparent layout row, so any wrapper element breaks it.
function BoardTopPanel() {
  const isOffline = useCollaborationStatus() === 'offline';
  return (
    <CenteredTopPanelContainer>
      <div className="flex flex-col items-center">
        {isOffline ? <OfflineIndicator /> : null}
        <TimerChip />
      </div>
    </CenteredTopPanelContainer>
  );
}

// Module-level so tldraw sees stable component identities across renders.
const TLDRAW_COMPONENTS: TLComponents = { TopPanel: BoardTopPanel };

const PANELS: Record<PanelId, { title: string; description?: string }> = {
  ai: {
    title: 'AI',
    description: 'Turn a sentence into an editable diagram, or ask AI about this board.',
  },
  comments: { title: 'Comments' },
  facilitate: { title: 'Facilitate' },
  history: {
    title: 'Version history',
    description: 'Save the board before big changes and roll back any time.',
  },
  export: { title: 'Export' },
};

interface CollabCanvasProps {
  boardId: string;
  role: BoardRole;
}

export function CollabCanvas({ boardId, role }: CollabCanvasProps) {
  const canEdit = canEditRole(role);
  // Selectors (not bare useSelf) avoid re-rendering on every presence change.
  const id = useSelf((me) => me.id);
  const info = useSelf((me) => me.info);
  const store = useYjsStore({ user: { id, color: info.color, name: info.name }, canEdit });

  const [editor, setEditor] = useState<Editor | null>(null);
  const [panel, setPanel] = useState<PanelId | null>(null);
  const [commentMode, setCommentMode] = useState(false);
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CommentDraft | null>(null);
  const comments = useComments(boardId, canCommentRole(role));
  const timer = useTimer();
  const votes = useVotes();
  const reactions = useReactions();

  const tabRefs = {
    ai: useRef<HTMLButtonElement>(null),
    comments: useRef<HTMLButtonElement>(null),
    facilitate: useRef<HTMLButtonElement>(null),
    history: useRef<HTMLButtonElement>(null),
    export: useRef<HTMLButtonElement>(null),
  };

  useTldrawColorScheme(editor);

  const ui: BoardUi = {
    boardId,
    canEdit,
    panel,
    setPanel,
    comments,
    commentMode,
    setCommentMode,
    openThreadId,
    setOpenThreadId,
    draft,
    setDraft,
    timer,
    votes,
    reactions,
  };

  const panelBodies: Record<PanelId, ReactNode> = {
    ai: <AiPanel boardId={boardId} />,
    comments: <CommentsPanel />,
    facilitate: <FacilitatePanel />,
    history: <VersionHistory boardId={boardId} />,
    export: <ExportMenu />,
  };

  return (
    <BoardUiContext.Provider value={ui}>
      <div className="absolute inset-0 flex">
        <div className="relative min-w-0 flex-1">
          <Tldraw
            store={store}
            licenseKey={licenseKey}
            autoFocus
            components={TLDRAW_COMPONENTS}
            onMount={(mounted) => {
              // Public viewers (non-owners) get a read-only canvas.
              if (!canEdit) mounted.updateInstanceState({ isReadonly: true });
              // Test-only handle for the sync E2E to read the scene. Gated by an
              // env flag so it never ships in a normal build.
              if (process.env.NEXT_PUBLIC_E2E_HOOKS === '1') {
                (window as unknown as { __tlEditor?: Editor }).__tlEditor = mounted;
              }
              setEditor(mounted);
            }}
          >
            <Reactions />
            <CursorChat />
            <Comments />
          </Tldraw>
        </div>

        {editor && panel ? (
          <EditorProvider editor={editor}>
            <DockPanel
              title={PANELS[panel].title}
              description={PANELS[panel].description}
              onClose={() => setPanel(null)}
              returnFocusRef={tabRefs[panel]}
            >
              {panelBodies[panel]}
            </DockPanel>
          </EditorProvider>
        ) : null}

        <BoardRail tabRefs={tabRefs} />
      </div>
    </BoardUiContext.Provider>
  );
}
