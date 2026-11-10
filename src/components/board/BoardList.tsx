'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

import { BoardCard } from '@/components/board/BoardCard';
import { Onboarding } from '@/components/board/Onboarding';
import { Button } from '@/components/ui/Button';
import { INPUT_CLASS } from '@/components/ui/field';
import { Icon } from '@/components/ui/Icon';
import { UndoToast } from '@/components/ui/UndoToast';
import { readError } from '@/lib/read-error';
import type { BoardSummary } from '@/types/board';

const UNDO_WINDOW_MS = 8000;
const NETWORK_ERROR = 'Could not reach the server. Check your connection and try again.';

interface BoardListProps {
  initialBoards: BoardSummary[];
}

interface PendingDelete {
  board: BoardSummary;
  index: number;
}

function sendDelete(id: string): Promise<Response> {
  // keepalive lets the request finish if the page is closing mid-window.
  return fetch(`/api/boards/${id}`, { method: 'DELETE', keepalive: true });
}

export function BoardList({ initialBoards }: BoardListProps) {
  const [boards, setBoards] = useState<BoardSummary[]>(initialBoards);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [isCreating, startCreate] = useTransition();
  // Mirrors pendingDelete for the unmount flush, which must not re-subscribe.
  const pendingDeleteRef = useRef<PendingDelete | null>(null);

  useEffect(() => {
    pendingDeleteRef.current = pendingDelete;
  }, [pendingDelete]);

  // Leaving the page inside the undo window still deletes the board.
  useEffect(() => {
    function flush() {
      if (pendingDeleteRef.current) void sendDelete(pendingDeleteRef.current.board.id);
      pendingDeleteRef.current = null;
    }
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, []);

  function markPending(id: string, on: boolean) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const reinsert = useCallback(({ board, index }: PendingDelete) => {
    setBoards((prev) => {
      if (prev.some((b) => b.id === board.id)) return prev;
      const next = [...prev];
      next.splice(Math.min(index, next.length), 0, board);
      return next;
    });
  }, []);

  function createBoard() {
    setError(null);
    startCreate(async () => {
      try {
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
      } catch {
        setError(NETWORK_ERROR);
      }
    });
  }

  async function renameBoard(id: string, title: string) {
    setError(null);
    // Roll back only this board's title, not a whole-array snapshot — a snapshot
    // restore would clobber concurrent edits to other cards.
    const previousTitle = boards.find((b) => b.id === id)?.title;
    const rollback = () => {
      if (previousTitle === undefined) return;
      setBoards((prev) => prev.map((b) => (b.id === id ? { ...b, title: previousTitle } : b)));
    };
    setBoards((prev) => prev.map((b) => (b.id === id ? { ...b, title } : b)));
    markPending(id, true);
    try {
      const res = await fetch(`/api/boards/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) {
        rollback();
        setError(await readError(res));
      }
    } catch {
      rollback();
      setError(NETWORK_ERROR);
    } finally {
      markPending(id, false);
    }
  }

  async function duplicateBoard(id: string) {
    setError(null);
    markPending(id, true);
    try {
      const res = await fetch(`/api/boards/${id}/duplicate`, { method: 'POST' });
      if (!res.ok) {
        setError(await readError(res));
        return;
      }
      const { data } = (await res.json()) as { data: BoardSummary };
      setBoards((prev) => [data, ...prev]);
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      markPending(id, false);
    }
  }

  const commitDelete = useCallback(
    async (target: PendingDelete) => {
      pendingDeleteRef.current = null;
      try {
        const res = await sendDelete(target.board.id);
        if (!res.ok) {
          reinsert(target);
          setError(await readError(res));
        }
      } catch {
        reinsert(target);
        setError(NETWORK_ERROR);
      }
    },
    [reinsert]
  );

  // Deletion is held for the undo window and only then sent to the server.
  function deleteBoard(id: string) {
    setError(null);
    const index = boards.findIndex((b) => b.id === id);
    const board = boards[index];
    if (!board) return;
    if (pendingDelete) void commitDelete(pendingDelete);
    setBoards((prev) => prev.filter((b) => b.id !== id));
    setPendingDelete({ board, index });
  }

  function undoDelete() {
    if (!pendingDelete) return;
    reinsert(pendingDelete);
    pendingDeleteRef.current = null;
    setPendingDelete(null);
  }

  // Reads the ref, not a state updater: updaters must stay side-effect free
  // (StrictMode runs them twice, which would send the DELETE twice).
  const expireDelete = useCallback(() => {
    const current = pendingDeleteRef.current;
    setPendingDelete(null);
    if (current) void commitDelete(current);
  }, [commitDelete]);

  const isEmpty = boards.length === 0;
  const needle = query.trim().toLowerCase();
  const visible = needle ? boards.filter((b) => b.title.toLowerCase().includes(needle)) : boards;

  return (
    <section className="flex flex-col gap-4">
      {!isEmpty ? (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <span className="text-ink-soft pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2">
              <Icon name="search" size={16} />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search boards"
              aria-label="Search boards"
              className={`${INPUT_CLASS} pl-8`}
            />
          </div>
          <Button variant="primary" onClick={createBoard} disabled={isCreating} className="ml-auto">
            <Icon name="plus" size={16} />
            {isCreating ? 'Creating…' : 'New board'}
          </Button>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : null}

      {isEmpty ? (
        <Onboarding onCreate={createBoard} isCreating={isCreating} />
      ) : visible.length === 0 ? (
        <p className="text-ink-soft border-line bg-surface rounded-lg border px-4 py-8 text-center text-sm">
          No boards match “{query.trim()}”.
        </p>
      ) : (
        <ul
          aria-label="Boards"
          className="border-line bg-surface overflow-hidden rounded-lg border"
        >
          {visible.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              isPending={pendingIds.has(board.id)}
              onRename={renameBoard}
              onDuplicate={duplicateBoard}
              onDelete={deleteBoard}
            />
          ))}
        </ul>
      )}

      {pendingDelete ? (
        <UndoToast
          key={pendingDelete.board.id}
          message={`Deleted “${pendingDelete.board.title}”`}
          onUndo={undoDelete}
          onExpire={expireDelete}
          durationMs={UNDO_WINDOW_MS}
        />
      ) : null}
    </section>
  );
}
