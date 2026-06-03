'use client';

import Link from 'next/link';
import { useState } from 'react';

import { BOARD_TITLE_MAX } from '@/lib/validations/board';
import type { BoardSummary } from '@/types/board';

interface BoardCardProps {
  board: BoardSummary;
  isPending: boolean;
  onRename: (id: string, title: string) => void | Promise<void>;
  onDuplicate: (id: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

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
    <article
      className="border-foreground/15 hover:border-foreground/30 group relative flex flex-col gap-3 rounded-xl border p-5 transition-colors"
      aria-busy={isPending}
    >
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
          className="border-foreground/20 rounded-md border bg-transparent px-2 py-1 text-base font-semibold"
        />
      ) : (
        <Link href={`/board/${board.id}`} className="text-base font-semibold hover:underline">
          {board.title}
        </Link>
      )}

      <p className="text-foreground/50 text-xs">
        Updated {new Date(board.updatedAt).toLocaleDateString()}
        {board.isPublic ? ' · Public' : ''}
      </p>

      <div className="mt-1 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            // Re-seed from the current prop: useState's initializer only ran
            // once, so a prior successful rename would otherwise leave draft stale.
            setDraft(board.title);
            setIsEditing(true);
          }}
          className="text-foreground/60 hover:text-foreground text-xs font-medium disabled:opacity-40"
        >
          Rename
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => onDuplicate(board.id)}
          className="text-foreground/60 hover:text-foreground text-xs font-medium disabled:opacity-40"
        >
          Duplicate
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => onDelete(board.id)}
          className="text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-40"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
