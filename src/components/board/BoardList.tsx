'use client';

import { useState, useTransition } from 'react';

import { BoardCard } from '@/components/board/BoardCard';
import type { BoardSummary } from '@/types/board';

interface BoardListProps {
  initialBoards: BoardSummary[];
}

async function readError(res: Response): Promise<string> {
  const body: unknown = await res.json().catch(() => null);
  if (
    body &&
    typeof body === 'object' &&
    'error' in body &&
    body.error &&
    typeof body.error === 'object' &&
    'message' in body.error &&
    typeof body.error.message === 'string'
  ) {
    return body.error.message;
  }
  return 'Something went wrong';
}

export function BoardList({ initialBoards }: BoardListProps) {
  const [boards, setBoards] = useState<BoardSummary[]>(initialBoards);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isCreating, startCreate] = useTransition();

  function markPending(id: string, on: boolean) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function createBoard() {
    setError(null);
    startCreate(async () => {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        setError(await readError(res));
        return;
      }
      const { data } = (await res.json()) as { data: BoardSummary };
      setBoards((prev) => [data, ...prev]);
    });
  }

  async function renameBoard(id: string, title: string) {
    setError(null);
    // Roll back only this board's title, not a whole-array snapshot — a snapshot
    // restore would clobber concurrent edits to other cards.
    const previousTitle = boards.find((b) => b.id === id)?.title;
    setBoards((prev) => prev.map((b) => (b.id === id ? { ...b, title } : b)));
    markPending(id, true);
    try {
      const res = await fetch(`/api/boards/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) {
        if (previousTitle !== undefined) {
          setBoards((prev) => prev.map((b) => (b.id === id ? { ...b, title: previousTitle } : b)));
        }
        setError(await readError(res));
      }
    } catch {
      if (previousTitle !== undefined) {
        setBoards((prev) => prev.map((b) => (b.id === id ? { ...b, title: previousTitle } : b)));
      }
      setError('Something went wrong');
    } finally {
      markPending(id, false);
    }
  }

  async function deleteBoard(id: string) {
    setError(null);
    // Capture only the removed item + its position; re-insert it on failure so a
    // concurrent rename/delete on another card is not undone.
    const index = boards.findIndex((b) => b.id === id);
    const removed = boards[index];
    setBoards((prev) => prev.filter((b) => b.id !== id));
    const restore = () => {
      if (!removed) return;
      setBoards((prev) => {
        if (prev.some((b) => b.id === id)) return prev;
        const next = [...prev];
        next.splice(Math.min(index, next.length), 0, removed);
        return next;
      });
    };
    try {
      const res = await fetch(`/api/boards/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        restore();
        setError(await readError(res));
      }
    } catch {
      restore();
      setError('Something went wrong');
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={createBoard}
          disabled={isCreating}
          className="btn btn-accent !px-5 !py-2.5 text-sm"
        >
          {isCreating ? 'Creating…' : '+ New board'}
        </button>
        {error ? (
          <p role="alert" className="text-sm font-semibold text-red-500">
            {error}
          </p>
        ) : null}
      </div>

      {boards.length === 0 ? (
        <div className="border-foreground/30 dotgrid flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed">
          <p className="font-hand text-accent -rotate-2 text-3xl">a blank canvas awaits</p>
          <p className="text-ink-soft text-sm">Hit “New board” to start your first one.</p>
        </div>
      ) : (
        <div className="grid gap-6 px-1 py-2 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board, i) => (
            <BoardCard
              key={board.id}
              board={board}
              index={i}
              isPending={pendingIds.has(board.id)}
              onRename={renameBoard}
              onDelete={deleteBoard}
            />
          ))}
        </div>
      )}
    </section>
  );
}
