'use client';

import { useState } from 'react';
import { track, useEditor } from 'tldraw';

import { CommentThread } from '@/components/board/CommentThread';
import { useComments } from '@/components/board/useComments';
import type { BoardRole } from '@/types/board';
import { canCommentRole } from '@/lib/board-roles';

interface Draft {
  x: number;
  y: number;
  body: string;
}

// Canvas comment layer. Wrapped in tldraw's `track` so reading the camera while
// projecting page coordinates to the viewport re-runs on every pan/zoom, keeping
// pins glued to their anchor. Rendered inside <Tldraw>, so useEditor has context.
export const Comments = track(function Comments({
  boardId,
  role,
}: {
  boardId: string;
  role: BoardRole;
}) {
  const editor = useEditor();
  const canComment = canCommentRole(role);
  const { threads, addComment, addReply, setResolved, removeComment } = useComments(
    boardId,
    canComment
  );

  const [mode, setMode] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  const roots = threads.filter((t) => t.x !== null && t.y !== null);
  const openThread = roots.find((t) => t.id === openId) ?? null;

  function placeDraft(e: React.MouseEvent) {
    const point = editor.screenToPage({ x: e.clientX, y: e.clientY });
    setDraft({ x: point.x, y: point.y, body: '' });
    setOpenId(null);
    setMode(false);
  }

  async function submitDraft() {
    if (!draft || !draft.body.trim()) return;
    const ok = await addComment(draft.x, draft.y, draft.body.trim());
    if (ok) setDraft(null);
  }

  return (
    <>
      {/* Toggle sits with the other canvas chrome (top-left, below AiPanel). */}
      {canComment ? (
        <button
          type="button"
          onClick={() => {
            setMode((m) => !m);
            setDraft(null);
          }}
          className={`pointer-events-auto absolute top-[calc(50%-1rem)] left-3 z-[300] rounded-md border px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur ${
            mode
              ? 'border-neutral-900 bg-neutral-900 text-white'
              : 'border-black/15 bg-white/95 text-neutral-700'
          }`}
        >
          {mode ? 'Click canvas to comment' : 'Comment'}
        </button>
      ) : null}

      {/* Click-catcher: only active in comment mode, so normal drawing is
          untouched otherwise. */}
      {mode ? (
        <div
          className="pointer-events-auto absolute inset-0 z-[290] cursor-crosshair"
          onClick={placeDraft}
        />
      ) : null}

      {/* Pins for each anchored root comment. */}
      {roots.map((thread) => {
        const p = editor.pageToViewport({ x: thread.x as number, y: thread.y as number });
        return (
          <button
            key={thread.id}
            type="button"
            onClick={() => setOpenId((id) => (id === thread.id ? null : thread.id))}
            style={{ left: p.x, top: p.y }}
            className={`pointer-events-auto absolute z-[295] flex h-6 w-6 -translate-y-full items-center justify-center rounded-full rounded-bl-none text-xs font-bold text-white shadow-md ${
              thread.resolved ? 'bg-neutral-400' : 'bg-amber-500'
            }`}
            aria-label="Open comment"
          >
            {thread.replies.length + 1}
          </button>
        );
      })}

      {/* Open thread popover, anchored just right of its pin. */}
      {openThread ? (
        <div
          style={{
            left:
              editor.pageToViewport({ x: openThread.x as number, y: openThread.y as number }).x +
              12,
            top: editor.pageToViewport({ x: openThread.x as number, y: openThread.y as number }).y,
          }}
          className="absolute z-[310] -translate-y-full"
        >
          <CommentThread
            thread={openThread}
            onReply={addReply}
            onResolve={setResolved}
            onDelete={async (commentId) => {
              const ok = await removeComment(commentId);
              if (ok && commentId === openThread.id) setOpenId(null);
              return ok;
            }}
            onClose={() => setOpenId(null)}
          />
        </div>
      ) : null}

      {/* New-comment composer at the just-clicked point. */}
      {draft ? (
        <div
          style={{
            left: editor.pageToViewport({ x: draft.x, y: draft.y }).x + 12,
            top: editor.pageToViewport({ x: draft.x, y: draft.y }).y,
          }}
          className="pointer-events-auto absolute z-[310] flex w-64 -translate-y-full flex-col gap-2 rounded-xl border border-black/10 bg-white/95 p-3 shadow-xl backdrop-blur"
        >
          <textarea
            autoFocus
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            placeholder="Add a comment…"
            rows={3}
            className="resize-none rounded-md border border-black/15 px-2 py-1 text-sm text-neutral-900 outline-none focus:border-black/40"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="rounded-md border border-black/15 px-3 py-1 text-xs font-medium text-neutral-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitDraft}
              disabled={!draft.body.trim()}
              className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-40"
            >
              Comment
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
});
