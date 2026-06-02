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
    const previous = boards;
    setBoards((prev) => prev.map((b) => (b.id === id ? { ...b, title } : b)));
    markPending(id, true);
    const res = await fetch(`/api/boards/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    markPending(id, false);
    if (!res.ok) {
      setBoards(previous);
      setError(await readError(res));
    }
  }

  async function deleteBoard(id: string) {
    setError(null);
    const previous = boards;
    setBoards((prev) => prev.filter((b) => b.id !== id));
    const res = await fetch(`/api/boards/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      setBoards(previous);
      setError(await readError(res));
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={createBoard}
          disabled={isCreating}
          className="bg-foreground text-background rounded-lg px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isCreating ? 'Creating…' : 'New board'}
        </button>
        {error ? (
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
        ) : null}
      </div>

      {boards.length === 0 ? (
        <div className="border-foreground/15 text-foreground/50 flex h-64 items-center justify-center rounded-xl border border-dashed text-sm">
          No boards yet — create your first one.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
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
