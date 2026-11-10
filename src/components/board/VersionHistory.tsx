'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { ConfirmInline } from '@/components/ui/ConfirmInline';
import { readError } from '@/lib/read-error';

interface VersionSummary {
  id: string;
  label: string | null;
  createdById: string | null;
  createdAt: string;
}

const NETWORK_ERROR = 'Could not reach the server. Check your connection and try again.';
const BEFORE_RESTORE_LABEL = 'Before restore';
const MINUTE_MS = 60_000;

function relativeTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / MINUTE_MS);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

type Busy = 'idle' | 'saving' | 'restoring' | 'loading';

// Panel body for the History tab. Restoring replaces the board for everyone, so
// it asks first and saves the current board as a version before overwriting.
export function VersionHistory({ boardId }: { boardId: string }) {
  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [busy, setBusy] = useState<Busy>('loading');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/boards/${boardId}/versions`);
      if (!res.ok) {
        setError(await readError(res));
        return;
      }
      const { data } = (await res.json()) as { data: VersionSummary[] };
      setVersions(data);
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setBusy('idle');
    }
  }, [boardId]);

  useEffect(() => {
    // load()'s setState runs after the fetch resolves, not synchronously here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function saveVersion(label?: string): Promise<boolean> {
    const res = await fetch(`/api/boards/${boardId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(label ? { label } : {}),
    });
    if (!res.ok) setError(await readError(res));
    return res.ok;
  }

  async function save() {
    if (busy !== 'idle') return;
    setBusy('saving');
    setError(null);
    setNotice(null);
    try {
      if (await saveVersion()) {
        setNotice('Version saved.');
        await load();
      }
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setBusy('idle');
    }
  }

  async function restore(version: VersionSummary) {
    if (busy !== 'idle') return;
    setBusy('restoring');
    setError(null);
    setNotice(null);
    try {
      // Safety net first: if this save fails, nothing is overwritten.
      if (!(await saveVersion(BEFORE_RESTORE_LABEL))) return;
      const res = await fetch(`/api/boards/${boardId}/versions/${version.id}/restore`, {
        method: 'POST',
      });
      if (!res.ok) {
        setError(await readError(res));
        return;
      }
      // The canvas updates for everyone via Liveblocks sync.
      setNotice(
        `Restored "${version.label || 'Snapshot'}". The previous board was saved as "${BEFORE_RESTORE_LABEL}".`
      );
      setConfirmId(null);
      await load();
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setBusy('idle');
    }
  }

  return (
    <>
      <Button variant="primary" onClick={save} disabled={busy !== 'idle'}>
        {busy === 'saving' ? 'Saving…' : 'Save current version'}
      </Button>

      {error ? (
        <p role="alert" className="text-danger text-[13px]">
          {error}
        </p>
      ) : null}
      <p role="status" className="text-ink-soft text-[13px] empty:hidden">
        {notice}
      </p>

      <ul className="-mx-2 flex flex-col">
        {busy === 'loading' ? (
          <li className="text-ink-soft px-2 py-2 text-[13px]">Loading versions…</li>
        ) : null}
        {versions.length === 0 && busy !== 'loading' ? (
          <li className="text-ink-soft px-2 py-2 text-[13px]">
            No saved versions yet. Save one before big changes so you can roll back.
          </li>
        ) : null}
        {versions.map((v) => (
          <li key={v.id} className="flex flex-col gap-2 px-2 py-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-foreground min-w-0 truncate text-[13px]">
                {v.label || 'Snapshot'}
              </span>
              <span className="text-ink-soft ml-auto shrink-0 text-xs tabular-nums">
                {relativeTime(v.createdAt)}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmId(v.id)}
                disabled={busy !== 'idle'}
                aria-label={`Restore ${v.label || 'snapshot'} from ${relativeTime(v.createdAt)}`}
              >
                Restore
              </Button>
            </div>
            {confirmId === v.id ? (
              <ConfirmInline
                tone="primary"
                message="Replace the board for everyone with this version? The current board is saved first."
                confirmLabel={busy === 'restoring' ? 'Restoring…' : 'Restore'}
                isBusy={busy === 'restoring'}
                onConfirm={() => void restore(v)}
                onCancel={() => setConfirmId(null)}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
