'use client';

import { useState } from 'react';

import type { CommentNode } from '@/lib/comments';

interface CommentThreadProps {
  thread: CommentNode;
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
  onReply,
  onResolve,
  onDelete,
  onClose,
}: CommentThreadProps) {
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  async function submitReply() {
    const body = reply.trim();
    if (!body || busy) return;
    setBusy(true);
    const ok = await onReply(thread.id, body);
    setBusy(false);
    if (ok) setReply('');
  }

  return (
    <div className="pointer-events-auto flex w-72 flex-col gap-2 rounded-xl border border-black/10 bg-white/95 p-3 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-neutral-700">
          {thread.resolved ? 'Resolved' : 'Comment'}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onResolve(thread.id, !thread.resolved)}
            className="text-xs font-medium text-neutral-500 hover:text-neutral-900"
          >
            {thread.resolved ? 'Reopen' : 'Resolve'}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close thread"
            className="text-neutral-500 hover:text-neutral-900"
          >
            ×
          </button>
        </div>
      </div>

      <ul className="flex max-h-56 flex-col gap-2 overflow-auto">
        {[thread, ...thread.replies].map((node) => (
          <li key={node.id} className="group flex flex-col gap-0.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-semibold text-neutral-800">{authorName(node)}</span>
              <button
                type="button"
                onClick={() => onDelete(node.id)}
                aria-label="Delete comment"
                className="text-xs text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-red-600"
              >
                Delete
              </button>
            </div>
            <p className="text-xs whitespace-pre-wrap text-neutral-700">{node.body}</p>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submitReply();
          }}
          placeholder="Reply…"
          className="min-w-0 flex-1 rounded-md border border-black/15 px-2 py-1 text-xs text-neutral-900 outline-none focus:border-black/40"
        />
        <button
          type="button"
          onClick={submitReply}
          disabled={busy || !reply.trim()}
          className="rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
