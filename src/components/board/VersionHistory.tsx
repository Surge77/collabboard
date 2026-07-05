'use client';

import { useCallback, useState } from 'react';

interface VersionSummary {
  id: string;
  label: string | null;
  createdById: string | null;
  createdAt: string;
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

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

type Busy = 'idle' | 'saving' | 'restoring' | 'loading';

export function VersionHistory({ boardId }: { boardId: string }) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [busy, setBusy] = useState<Busy>('idle');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBusy('loading');
    setError(null);
    try {
      const res = await fetch(`/api/boards/${boardId}/versions`);
      if (!res.ok) {
        setError(await readError(res));
        return;
      }
      const { data } = (await res.json()) as { data: VersionSummary[] };
      setVersions(data);
    } catch {
      setError('Something went wrong');
    } finally {
      setBusy('idle');
    }
  }, [boardId]);

  function openAndLoad() {
    setOpen(true);
    void load();
  }

  async function save() {
    if (busy !== 'idle') return;
    setBusy('saving');
    setError(null);
    try {
      const res = await fetch(`/api/boards/${boardId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        setError(await readError(res));
        return;
      }
      await load();
    } catch {
      setError('Something went wrong');
    } finally {
      setBusy('idle');
    }
  }

  async function restore(versionId: string) {
    if (busy !== 'idle') return;
    setBusy('restoring');
    setError(null);
    try {
      const res = await fetch(`/api/boards/${boardId}/versions/${versionId}/restore`, {
        method: 'POST',
      });
      if (!res.ok) setError(await readError(res));
      // On success the canvas updates for everyone via Liveblocks sync — no
      // local mutation needed here.
    } catch {
      setError('Something went wrong');
    } finally {
      setBusy('idle');
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={openAndLoad}
        className="pointer-events-auto absolute right-3 bottom-3 z-[300] rounded-md border border-black/15 bg-white/95 px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-lg backdrop-blur"
      >
        History
      </button>
    );
  }

  return (
    <div className="pointer-events-auto absolute right-3 bottom-3 z-[300] flex max-h-[60vh] w-64 flex-col gap-2 rounded-xl border border-black/10 bg-white/95 p-3 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-neutral-700">Version history</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close history"
          className="text-neutral-500 hover:text-neutral-900"
        >
          ×
        </button>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={busy !== 'idle'}
        className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
      >
        {busy === 'saving' ? 'Saving…' : 'Save current version'}
      </button>

      {error ? (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}

      <ul className="flex flex-col gap-1 overflow-auto">
        {versions.length === 0 && busy !== 'loading' ? (
          <li className="py-2 text-xs text-neutral-500">No saved versions yet.</li>
        ) : null}
        {versions.map((v) => (
          <li
            key={v.id}
            className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-black/5"
          >
            <span className="truncate text-xs text-neutral-700">
              {v.label || 'Snapshot'} · {relativeTime(v.createdAt)}
            </span>
            <button
              type="button"
              onClick={() => restore(v.id)}
              disabled={busy !== 'idle'}
              className="shrink-0 rounded border border-black/15 px-2 py-0.5 text-xs font-medium text-neutral-700 disabled:opacity-40"
            >
              {busy === 'restoring' ? '…' : 'Restore'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
