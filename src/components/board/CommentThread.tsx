'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { ConfirmInline } from '@/components/ui/ConfirmInline';
import { INPUT_CLASS } from '@/components/ui/field';
import { IconButton } from '@/components/ui/IconButton';
import type { CommentNode } from '@/lib/comments';

interface CommentThreadProps {
  thread: CommentNode;
  canComment: boolean;
  onReply: (parentId: string, body: string) => Promise<boolean>;
  onResolve: (commentId: string, resolved: boolean) => Promise<boolean>;
  onDelete: (commentId: string) => Promise<boolean>;
  onClose: () => void;
}

function authorName(node: CommentNode): string {
  return node.author.name ?? 'Someone';
}

// Popover for a single comment thread: the root comment, its replies, a reply
// composer, and resolve/delete actions. Positioning is the parent's job.
export function CommentThread({
  thread,
  canComment,
  onReply,
  onResolve,
  onDelete,
  onClose,
}: CommentThreadProps) {
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submitReply() {
    const body = reply.trim();
    if (!body || busy) return;
    setBusy(true);
    setError(null);
    const ok = await onReply(thread.id, body);
    setBusy(false);
    if (ok) setReply('');
    else setError('Reply not sent. Try again.');
  }

  async function confirmDelete(id: string) {
    setBusy(true);
    setError(null);
    const ok = await onDelete(id);
    setBusy(false);
    setConfirmDeleteId(null);
    if (!ok) setError('Comment not deleted. Try again.');
  }

  return (
    <div
      role="dialog"
      aria-label={`Comment thread by ${authorName(thread)}`}
      className="border-line bg-raised shadow-pop pointer-events-auto flex w-72 flex-col gap-3 rounded-lg border p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-ink-soft text-xs font-medium">
          {thread.resolved ? 'Resolved thread' : 'Thread'}
        </span>
        <div className="flex items-center gap-0.5">
          {canComment ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void onResolve(thread.id, !thread.resolved)}
            >
              {thread.resolved ? 'Reopen' : 'Resolve'}
            </Button>
          ) : null}
          <IconButton icon="close" label="Close thread" size="sm" onClick={onClose} />
        </div>
      </div>

      <ul className="flex max-h-60 flex-col gap-3 overflow-auto">
        {[thread, ...thread.replies].map((node) => (
          <li key={node.id} className="group flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-foreground text-[13px] font-semibold">{authorName(node)}</span>
              {canComment ? (
                <IconButton
                  icon="trash"
                  size="sm"
                  label={`Delete comment by ${authorName(node)}`}
                  onClick={() => setConfirmDeleteId(node.id)}
                  className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100"
                />
              ) : null}
            </div>
            <p className="text-foreground text-[13px] leading-snug whitespace-pre-wrap">
              {node.body}
            </p>
            {confirmDeleteId === node.id ? (
              <ConfirmInline
                message={
                  node.id === thread.id
                    ? 'Delete this comment and its replies for everyone?'
                    : 'Delete this reply for everyone?'
                }
                confirmLabel="Delete"
                isBusy={busy}
                onConfirm={() => void confirmDelete(node.id)}
                onCancel={() => setConfirmDeleteId(null)}
              />
            ) : null}
          </li>
        ))}
      </ul>

      {canComment ? (
        <form
          className="flex gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            void submitReply();
          }}
        >
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Reply…"
            aria-label="Reply to thread"
            className={`${INPUT_CLASS} h-8 min-w-0 flex-1 text-[13px]`}
          />
          <Button type="submit" size="sm" variant="primary" disabled={busy || !reply.trim()}>
            Send
          </Button>
        </form>
      ) : null}
      {error ? (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}
