'use client';

import { useState } from 'react';

interface ShareDialogProps {
  boardId: string;
  initialIsPublic: boolean;
}

export function ShareDialog({ boardId, initialIsPublic }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url = typeof window !== 'undefined' ? `${window.location.origin}/board/${boardId}` : '';

  async function toggle() {
    if (pending) return;
    const next = !isPublic;
    setIsPublic(next);
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/boards/${boardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: next }),
      });
      if (!res.ok) {
        setIsPublic(!next);
        setError('Could not update sharing');
      }
    } catch {
      setIsPublic(!next);
      setError('Could not update sharing');
    } finally {
      setPending(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Copy failed');
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="border-foreground/15 hover:bg-foreground/5 rounded-lg border px-3 py-1.5 text-sm font-medium"
      >
        Share
      </button>
      {open ? (
        <div className="border-foreground/15 bg-background absolute right-0 z-50 mt-2 w-72 rounded-xl border p-3 shadow-lg">
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>
              <span className="font-medium">Public</span>
              <span className="text-foreground/50 block text-xs">
                Anyone signed in with the link can view
              </span>
            </span>
            <input
              type="checkbox"
              checked={isPublic}
              disabled={pending}
              onChange={toggle}
              className="h-4 w-4"
            />
          </label>
          {isPublic ? (
            <div className="mt-3 flex gap-2">
              <input
                readOnly
                value={url}
                className="border-foreground/15 min-w-0 flex-1 rounded-md border px-2 py-1 text-xs"
              />
              <button
                type="button"
                onClick={copy}
                className="bg-foreground text-background rounded-md px-2.5 py-1 text-xs font-medium"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          ) : null}
          {error ? <p className="mt-2 text-xs text-red-500">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
