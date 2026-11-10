'use client';

import { useEffect, useRef } from 'react';
import { track, useEditor } from 'tldraw';

import { useBoardUi } from '@/components/board/board-ui';
import { CommentThread } from '@/components/board/CommentThread';
import { Button } from '@/components/ui/Button';
import { TEXTAREA_CLASS } from '@/components/ui/field';
import { useDismiss } from '@/components/ui/useDismiss';
import type { CommentNode } from '@/lib/comments';

const POPOVER_WIDTH = 288;
const POPOVER_ESTIMATED_HEIGHT = 260;
const PIN_GAP = 12;

// Places a popover beside its anchor, flipping left/down when it would leave
// the canvas viewport so it is never clipped at the edges.
function popoverPosition(anchor: { x: number; y: number }, bounds: { w: number; h: number }) {
  const fitsRight = anchor.x + PIN_GAP + POPOVER_WIDTH <= bounds.w;
  const left = fitsRight ? anchor.x + PIN_GAP : Math.max(8, anchor.x - PIN_GAP - POPOVER_WIDTH);
  const fitsAbove = anchor.y - POPOVER_ESTIMATED_HEIGHT >= 0;
  return fitsAbove
    ? { left, top: anchor.y, transform: 'translateY(-100%)' }
    : { left, top: anchor.y + PIN_GAP, transform: 'none' };
}

function pinLabel(thread: CommentNode): string {
  const author = thread.author.name ?? 'Someone';
  const replies = thread.replies.length;
  const replyText = replies === 0 ? '' : `, ${replies} ${replies === 1 ? 'reply' : 'replies'}`;
  return `Comment by ${author}${replyText}${thread.resolved ? ', resolved' : ''}`;
}

function focusPin(id: string) {
  document.querySelector<HTMLElement>(`[data-comment-pin="${id}"]`)?.focus();
}

// Canvas comment layer, rendered inside <Tldraw>. Wrapped in `track` so reading
// the camera while projecting page coordinates re-runs on every pan/zoom,
// keeping pins glued to their anchor.
export const Comments = track(function Comments() {
  const editor = useEditor();
  const ui = useBoardUi();
  const { comments, commentMode, setCommentMode, openThreadId, setOpenThreadId, draft, setDraft } =
    ui;
  const threadRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<HTMLDivElement>(null);

  const viewport = editor.getViewportScreenBounds();
  const bounds = { w: viewport.w, h: viewport.h };
  const roots = comments.threads.filter((t) => t.x !== null && t.y !== null);
  const openThread = roots.find((t) => t.id === openThreadId) ?? null;

  useEffect(() => {
    if (!commentMode) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setCommentMode(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [commentMode, setCommentMode]);

  useDismiss({
    open: openThread !== null,
    onDismiss: () => {
      if (openThreadId) focusPin(openThreadId);
      setOpenThreadId(null);
    },
    containerRef: threadRef,
  });
  useDismiss({
    open: draft !== null,
    onDismiss: () => setDraft(null),
    containerRef: draftRef,
    closeOnOutside: false,
  });

  function placeDraft(e: React.MouseEvent) {
    const point = editor.screenToPage({ x: e.clientX, y: e.clientY });
    setDraft({ x: point.x, y: point.y, body: '' });
    setOpenThreadId(null);
    setCommentMode(false);
  }

  async function submitDraft() {
    if (!draft || !draft.body.trim()) return;
    const ok = await comments.addComment(draft.x, draft.y, draft.body.trim());
    if (ok) setDraft(null);
  }

  return (
    <>
      {/* Click-catcher: only active in comment mode, so normal drawing is
          untouched otherwise. */}
      {commentMode ? (
        <div
          aria-hidden="true"
          className="pointer-events-auto absolute inset-0 z-[290] cursor-crosshair"
          onClick={placeDraft}
        />
      ) : null}

      {roots.map((thread) => {
        const p = editor.pageToViewport({ x: thread.x as number, y: thread.y as number });
        return (
          <button
            key={thread.id}
            type="button"
            data-comment-pin={thread.id}
            onClick={() => setOpenThreadId(openThreadId === thread.id ? null : thread.id)}
            style={{ left: p.x, top: p.y }}
            aria-label={pinLabel(thread)}
            aria-expanded={openThreadId === thread.id}
            className={`shadow-pop pointer-events-auto absolute z-[295] flex h-7 min-w-7 -translate-y-full items-center justify-center rounded-full rounded-bl-none px-1.5 text-xs font-semibold tabular-nums pointer-coarse:h-9 pointer-coarse:min-w-9 ${
              thread.resolved
                ? 'border-line-strong bg-surface text-ink-soft border'
                : 'bg-foreground text-background'
            }`}
          >
            {thread.replies.length + 1}
          </button>
        );
      })}

      {openThread ? (
        <div
          ref={threadRef}
          style={popoverPosition(
            editor.pageToViewport({ x: openThread.x as number, y: openThread.y as number }),
            bounds
          )}
          className="absolute z-[310]"
        >
          <CommentThread
            thread={openThread}
            canComment={comments.canComment}
            onReply={comments.addReply}
            onResolve={comments.setResolved}
            onDelete={async (commentId) => {
              const ok = await comments.removeComment(commentId);
              if (ok && commentId === openThread.id) setOpenThreadId(null);
              return ok;
            }}
            onClose={() => {
              focusPin(openThread.id);
              setOpenThreadId(null);
            }}
          />
        </div>
      ) : null}

      {draft ? (
        <div
          ref={draftRef}
          role="dialog"
          aria-label="New comment"
          style={popoverPosition(editor.pageToViewport({ x: draft.x, y: draft.y }), bounds)}
          className="border-line bg-raised shadow-pop pointer-events-auto absolute z-[310] flex w-72 flex-col gap-2 rounded-lg border p-3"
        >
          <textarea
            autoFocus
            aria-label="Comment"
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void submitDraft();
            }}
            placeholder="Add a comment…"
            rows={3}
            className={TEXTAREA_CLASS}
          />
          <div className="flex justify-end gap-1.5">
            <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => void submitDraft()}
              disabled={!draft.body.trim()}
            >
              Comment
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
});
