'use client';

import Link from 'next/link';
import { useState } from 'react';

import { BOARD_TITLE_MAX } from '@/lib/validations/board';
import type { BoardSummary } from '@/types/board';

interface BoardCardProps {
  board: BoardSummary;
  isPending: boolean;
  // Position in the grid; drives the cosmetic pin colour and tilt. Optional so
  // callers that don't care about variety (e.g. tests) can omit it.
  index?: number;
  onRename: (id: string, title: string) => void | Promise<void>;
  onDuplicate: (id: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

// Cycled so a wall of boards looks pinned by hand rather than grid-perfect.
const PIN_COLORS = ['var(--coral)', 'var(--accent)', '#10b981', '#f59e0b'];
const TILTS = ['-rotate-1', 'rotate-1', 'rotate-2', '-rotate-2'];

export function BoardCard({
  board,
  isPending,
  index = 0,
  onRename,
  onDuplicate,
  onDelete,
}: BoardCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(board.title);

  const pin = PIN_COLORS[index % PIN_COLORS.length];
  const tilt = TILTS[index % TILTS.length];

  function commit() {
    const next = draft.trim();
    if (next && next !== board.title) onRename(board.id, next);
    else setDraft(board.title);
    setIsEditing(false);
  }

  return (
    <article
      className={`bg-surface border-foreground sketch lift ${tilt} group relative flex flex-col gap-3 border-2 p-5`}
      aria-busy={isPending}
    >
      <span
        className="absolute -top-2 right-4 h-4 w-4 rounded-full border-2"
        style={{ backgroundColor: pin, borderColor: 'var(--background)' }}
        aria-hidden="true"
      />
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
          className="border-foreground/30 rounded-md border-2 bg-transparent px-2 py-1 text-base font-bold"
        />
      ) : (
        <Link
          href={`/board/${board.id}`}
          className="decoration-coral text-foreground text-lg font-bold underline-offset-4 hover:underline"
        >
          {board.title}
        </Link>
      )}

      <p className="text-ink-soft font-mono text-xs">
        {new Date(board.updatedAt).toLocaleDateString()}
        {board.isPublic ? ' · public' : ''}
      </p>

      <div className="mt-1 flex gap-3 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            // Re-seed from the current prop: useState's initializer only ran
            // once, so a prior successful rename would otherwise leave draft stale.
            setDraft(board.title);
            setIsEditing(true);
          }}
          className="text-ink-soft hover:text-accent text-xs font-semibold disabled:opacity-40"
        >
          Rename
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => onDuplicate(board.id)}
          className="text-ink-soft hover:text-accent text-xs font-semibold disabled:opacity-40"
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
