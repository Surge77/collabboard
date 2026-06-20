'use client';

import { useCallback, useState } from 'react';

interface ShareLink {
  id: string;
  token: string;
  role: 'VIEWER' | 'EDITOR';
  expiresAt: string | null;
  createdAt: string;
}

interface ShareDialogProps {
  boardId: string;
  initialIsPublic: boolean;
}

export function ShareDialog({ boardId, initialIsPublic }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [role, setRole] = useState<'VIEWER' | 'EDITOR'>('VIEWER');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const linkUrl = (token: string) => `${origin}/board/${boardId}?t=${token}`;

  const loadLinks = useCallback(async () => {
    try {
      const res = await fetch(`/api/boards/${boardId}/share-links`);
      if (res.ok) {
        const { data } = (await res.json()) as { data: ShareLink[] };
        setLinks(data);
      }
    } catch {
      // Non-fatal: the dialog still works for the public toggle.
    }
  }, [boardId]);

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) void loadLinks();
  }

  async function togglePublic() {
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

  async function createLink() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/boards/${boardId}/share-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        setError('Could not create link');
        return;
      }
      const { data } = (await res.json()) as { data: ShareLink };
      setLinks((current) => [data, ...current]);
    } catch {
      setError('Could not create link');
    } finally {
      setPending(false);
    }
  }

  async function revoke(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/boards/${boardId}/share-links?linkId=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) setLinks((current) => current.filter((link) => link.id !== id));
      else setError('Could not revoke link');
    } catch {
      setError('Could not revoke link');
    }
  }

  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setError('Copy failed');
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className="border-foreground/15 hover:bg-foreground/5 rounded-lg border px-3 py-1.5 text-sm font-medium"
      >
        Share
      </button>
      {open ? (
        <div className="border-foreground/15 bg-background absolute right-0 z-50 mt-2 w-80 rounded-xl border p-3 shadow-lg">
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>
              <span className="font-medium">Public</span>
              <span className="text-foreground/50 block text-xs">
                Anyone signed in with the board link can view
              </span>
            </span>
            <input
              type="checkbox"
              checked={isPublic}
              disabled={pending}
              onChange={togglePublic}
              className="h-4 w-4"
            />
          </label>

          <div className="border-foreground/10 mt-3 border-t pt-3">
            <p className="mb-1 text-sm font-medium">Invite links</p>
            <div className="flex gap-2">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'VIEWER' | 'EDITOR')}
                className="border-foreground/15 flex-1 rounded-md border px-2 py-1 text-xs"
              >
                <option value="VIEWER">Can view</option>
                <option value="EDITOR">Can edit</option>
              </select>
              <button
                type="button"
                onClick={createLink}
                disabled={pending}
                className="bg-foreground text-background rounded-md px-2.5 py-1 text-xs font-medium disabled:opacity-40"
              >
                Create link
              </button>
            </div>

            <ul className="mt-2 flex flex-col gap-2">
              {links.map((link) => (
                <li key={link.id} className="flex items-center gap-2">
                  <span className="text-foreground/60 w-12 shrink-0 text-xs">
                    {link.role === 'EDITOR' ? 'Edit' : 'View'}
                  </span>
                  <button
                    type="button"
                    onClick={() => copy(linkUrl(link.token), link.id)}
                    className="border-foreground/15 min-w-0 flex-1 truncate rounded-md border px-2 py-1 text-left text-xs"
                  >
                    {copiedId === link.id ? 'Copied!' : linkUrl(link.token)}
                  </button>
                  <button
                    type="button"
                    onClick={() => revoke(link.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {error ? <p className="mt-2 text-xs text-red-500">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
