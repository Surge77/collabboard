'use client';

import Link from 'next/link';
import { useState } from 'react';

import { INPUT_CLASS } from '@/components/ui/field';
import { IconButton } from '@/components/ui/IconButton';
import { formatEdited } from '@/lib/format-date';
import { BOARD_TITLE_MAX } from '@/lib/validations/board';
import type { BoardSummary } from '@/types/board';

interface BoardCardProps {
  board: BoardSummary;
  isPending: boolean;
  onRename: (id: string, title: string) => void | Promise<void>;
  onDuplicate: (id: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

// One board as a list row: title, sharing, last edit, and row actions. The
// actions show on hover/focus with a fine pointer and always on touch, and each
// is named with the board title so a screen reader never hears a bare "Delete".
export function BoardCard({ board, isPending, onRename, onDuplicate, onDelete }: BoardCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(board.title);

  function commit() {
    const next = draft.trim();
    if (next && next !== board.title) onRename(board.id, next);
    else setDraft(board.title);
    setIsEditing(false);
  }

  return (
    <li
      aria-busy={isPending}
      className="group border-line hover:bg-hover relative flex min-h-14 items-center gap-3 border-b px-3 py-2 transition-colors duration-150 last:border-b-0"
    >
      <span
        className="border-line-strong text-ink-soft hidden h-8 w-8 shrink-0 items-center justify-center rounded border sm:flex"
        aria-hidden="true"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="5" width="4" height="4" stroke="currentColor" strokeWidth="1.2" />
          <rect x="10" y="5" width="4" height="4" stroke="currentColor" strokeWidth="1.2" />
          <path d="M6 7h4" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </span>

      <div className="flex min-w-0 flex-1 flex-col pointer-coarse:pr-36">
        {isEditing ? (
          <input
            autoFocus
            aria-label="Board title"
            value={draft}
            maxLength={BOARD_TITLE_MAX}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') {
                setDraft(board.title);
                setIsEditing(false);
              }
            }}
            className={`${INPUT_CLASS} h-8 font-medium`}
          />
        ) : (
          <Link
            href={`/board/${board.id}`}
            className="text-foreground truncate text-sm font-medium after:absolute after:inset-0 hover:underline hover:underline-offset-2"
          >
            {board.title}
          </Link>
        )}
        {/* On phones the date moves under the title so the name gets the width. */}
        <span className="text-ink-soft text-xs tabular-nums sm:hidden">
          <span className="sr-only">Edited </span>
          {formatEdited(board.updatedAt)}
          {board.isPublic ? ' · Public' : ''}
        </span>
      </div>

      {board.isPublic ? (
        <span className="border-line-strong text-ink-soft hidden shrink-0 rounded border px-1.5 py-0.5 text-xs sm:inline">
          Public
        </span>
      ) : null}
      <span className="text-ink-soft hidden w-28 shrink-0 text-right text-xs tabular-nums sm:inline">
        <span className="sr-only">Edited </span>
        {formatEdited(board.updatedAt)}
      </span>

      {/* Overlaid at the row's right edge so hidden actions never take width
          from the title; always shown on touch, on hover/focus otherwise. */}
      <div className="bg-hover absolute inset-y-0 right-0 z-10 flex items-center gap-0.5 pr-2 pl-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100 pointer-coarse:bg-transparent pointer-coarse:opacity-100">
        <IconButton
          icon="pencil"
          size="sm"
          label={`Rename ${board.title}`}
          disabled={isPending}
          onClick={() => {
            // Re-seed from the current prop: useState's initializer only ran
            // once, so a prior successful rename would otherwise leave draft stale.
            setDraft(board.title);
            setIsEditing(true);
          }}
        />
        <IconButton
          icon="copy"
          size="sm"
          label={`Duplicate ${board.title}`}
          disabled={isPending}
          onClick={() => onDuplicate(board.id)}
        />
        <IconButton
          icon="trash"
          size="sm"
          label={`Delete ${board.title}`}
          disabled={isPending}
          onClick={() => onDelete(board.id)}
          className="hover:text-danger"
        />
      </div>
    </li>
  );
}
