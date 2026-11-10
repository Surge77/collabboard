'use client';

import { createContext, useContext } from 'react';

import type { ReactionState, TimerState, VoteState } from '@/components/board/useFacilitation';
import type { UseComments } from '@/components/board/useComments';

export type PanelId = 'ai' | 'comments' | 'history' | 'facilitate' | 'export';

export interface CommentDraft {
  x: number;
  y: number;
  body: string;
}

// Board-level UI state shared between the right rail (outside the tldraw
// canvas) and the overlays drawn inside it (comment pins, reactions).
export interface BoardUi {
  boardId: string;
  canEdit: boolean;
  panel: PanelId | null;
  setPanel: (panel: PanelId | null) => void;
  comments: UseComments;
  commentMode: boolean;
  setCommentMode: (on: boolean) => void;
  openThreadId: string | null;
  setOpenThreadId: (id: string | null) => void;
  draft: CommentDraft | null;
  setDraft: (draft: CommentDraft | null) => void;
  timer: TimerState;
  votes: VoteState;
  reactions: ReactionState;
}

export const BoardUiContext = createContext<BoardUi | null>(null);

export function useBoardUi(): BoardUi {
  const ui = useContext(BoardUiContext);
  if (!ui) throw new Error('useBoardUi must be used inside BoardUiContext');
  return ui;
}
