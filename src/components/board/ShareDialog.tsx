'use client';

import { useCallback, useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { ConfirmInline } from '@/components/ui/ConfirmInline';
import { INPUT_CLASS, LABEL_CLASS } from '@/components/ui/field';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { useDismiss } from '@/components/ui/useDismiss';

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

const COPIED_MS = 1500;

export function ShareDialog({ boardId, initialIsPublic }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [role, setRole] = useState<'VIEWER' | 'EDITOR'>('VIEWER');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dialogId = useId();
  const roleId = useId();
  const publicId = useId();

  const close = useCallback(() => setOpen(false), []);
  useDismiss({ open, onDismiss: close, containerRef: panelRef, returnFocusRef: triggerRef });

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const linkUrl = (token: string) => `${origin}/board/${boardId}?t=${token}`;

  const loadLinks = useCallback(async () => {
    try {
      const res = await fetch(`/api/boards/${boardId}/share-links`);
      if (res.ok) {
        const { data } = (await res.json()) as { data: ShareLink[] };
        setLinks(data);
      } else {
        setError('Could not load invite links.');
      }
    } catch {
      setError('Could not load invite links.');
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
        setError('Could not update sharing. Try again.');
      }
    } catch {
      setIsPublic(!next);
      setError('Could not update sharing. Try again.');
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
        setError('Could not create the link. Try again.');
        return;
      }
      const { data } = (await res.json()) as { data: ShareLink };
      setLinks((current) => [data, ...current]);
    } catch {
      setError('Could not create the link. Try again.');
    } finally {
      setPending(false);
    }
  }

  async function revoke(id: string) {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/share-links?linkId=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) setLinks((current) => current.filter((link) => link.id !== id));
      else setError('Could not revoke the link. Try again.');
    } catch {
      setError('Could not revoke the link. Try again.');
    } finally {
      setPending(false);
      setConfirmRevokeId(null);
    }
  }

  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), COPIED_MS);
    } catch {
      setError('Copy failed. Select the link and copy it manually.');
    }
  }

  return (
    <div className="relative">
      <Button
        ref={triggerRef}
        variant="primary"
        size="sm"
        onClick={toggleOpen}
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
      >
        <Icon name="link" size={16} />
        Share
      </Button>
      {open ? (
        <div
          ref={panelRef}
          id={dialogId}
          role="dialog"
          aria-label="Share board"
          className="border-line bg-raised shadow-pop absolute right-0 z-[500] mt-2 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-4 rounded-lg border p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <label htmlFor={publicId} className="flex flex-col">
              <span className="text-foreground text-sm font-medium">
                Anyone with the link can view
              </span>
              <span className="text-ink-soft text-xs">Viewers still need to sign in.</span>
            </label>
            <button
              id={publicId}
              type="button"
              role="switch"
              aria-checked={isPublic}
              disabled={pending}
              onClick={togglePublic}
              className={`relative h-6 w-10 shrink-0 rounded-full transition-colors duration-150 disabled:opacity-45 ${
                isPublic ? 'bg-accent' : 'bg-selected border-line-strong border'
              }`}
            >
              <span
                className={`bg-surface absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full shadow transition-[left] duration-150 ${
                  isPublic ? 'left-5' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="border-line flex flex-col gap-2 border-t pt-4">
            <label htmlFor={roleId} className={LABEL_CLASS}>
              Invite link
            </label>
            <div className="flex gap-1.5">
              <select
                id={roleId}
                value={role}
                onChange={(e) => setRole(e.target.value as 'VIEWER' | 'EDITOR')}
                className={`${INPUT_CLASS} min-w-0 flex-1`}
              >
                <option value="VIEWER">Can view</option>
                <option value="EDITOR">Can edit</option>
              </select>
              <Button onClick={createLink} disabled={pending}>
                Create link
              </Button>
            </div>

            {links.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {links.map((link) => (
                  <li key={link.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-ink-soft w-10 shrink-0 text-xs font-medium">
                        {link.role === 'EDITOR' ? 'Edit' : 'View'}
                      </span>
                      <button
                        type="button"
                        onClick={() => copy(linkUrl(link.token), link.id)}
                        aria-label={`Copy ${link.role === 'EDITOR' ? 'edit' : 'view'} link`}
                        className="border-line-strong hover:bg-hover text-foreground min-w-0 flex-1 truncate rounded-md border px-2 py-1.5 text-left text-xs"
                      >
                        {copiedId === link.id ? 'Copied to clipboard' : linkUrl(link.token)}
                      </button>
                      <IconButton
                        icon="trash"
                        size="sm"
                        label={`Revoke ${link.role === 'EDITOR' ? 'edit' : 'view'} link`}
                        onClick={() => setConfirmRevokeId(link.id)}
                      />
                    </div>
                    {confirmRevokeId === link.id ? (
                      <ConfirmInline
                        message="Revoke this link? Anyone using it loses access."
                        confirmLabel="Revoke"
                        isBusy={pending}
                        onConfirm={() => void revoke(link.id)}
                        onCancel={() => setConfirmRevokeId(null)}
                      />
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-soft text-xs">No invite links yet.</p>
            )}
          </div>

          <p role="status" className="sr-only">
            {copiedId ? 'Link copied to clipboard' : ''}
          </p>
          {error ? (
            <p role="alert" className="text-danger text-[13px]">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
