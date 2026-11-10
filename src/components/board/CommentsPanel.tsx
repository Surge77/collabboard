'use client';

import { useState } from 'react';
import { useEditor } from 'tldraw';

import { useBoardUi } from '@/components/board/board-ui';
import { Button } from '@/components/ui/Button';
import type { CommentNode } from '@/lib/comments';

const EXCERPT_LENGTH = 80;

function excerpt(body: string): string {
  return body.length > EXCERPT_LENGTH ? `${body.slice(0, EXCERPT_LENGTH)}…` : body;
}

// Panel body for the Comments tab. Doubles as the keyboard path: a comment can
// be placed at the selection or the centre of the view without a pointer, and
// every thread is reachable from this list.
export function CommentsPanel() {
  const editor = useEditor();
  const { comments, commentMode, setCommentMode, setDraft, setOpenThreadId } = useBoardUi();
  const [showResolved, setShowResolved] = useState(false);

  const anchored = comments.threads.filter((t) => t.x !== null && t.y !== null);
  const open = anchored.filter((t) => !t.resolved);
  const resolved = anchored.filter((t) => t.resolved);

  function placeAtView() {
    const selection = editor.getSelectionPageBounds();
    const point = selection
      ? { x: selection.maxX, y: selection.minY }
      : editor.getViewportPageBounds().center;
    setCommentMode(false);
    setOpenThreadId(null);
    setDraft({ x: point.x, y: point.y, body: '' });
  }

  function goTo(thread: CommentNode) {
    editor.centerOnPoint(
      { x: thread.x as number, y: thread.y as number },
      { animation: { duration: 200 } }
    );
    setDraft(null);
    setOpenThreadId(thread.id);
  }

  function renderThread(thread: CommentNode) {
    const replies = thread.replies.length;
    return (
      <li key={thread.id}>
        <button
          type="button"
          onClick={() => goTo(thread)}
          className="hover:bg-hover flex w-full flex-col gap-0.5 rounded-md px-2 py-2 text-left transition-colors duration-150"
        >
          <span className="flex w-full items-baseline justify-between gap-2">
            <span className="text-foreground truncate text-[13px] font-semibold">
              {thread.author.name ?? 'Someone'}
            </span>
            <span className="text-ink-soft shrink-0 text-xs tabular-nums">
              {replies === 0 ? 'No replies' : `${replies} ${replies === 1 ? 'reply' : 'replies'}`}
            </span>
          </span>
          <span className="text-ink-soft text-[13px] leading-snug">{excerpt(thread.body)}</span>
        </button>
      </li>
    );
  }

  return (
    <>
      {comments.canComment ? (
        <div className="flex flex-col gap-2">
          <Button
            variant={commentMode ? 'secondary' : 'primary'}
            aria-pressed={commentMode}
            onClick={() => setCommentMode(!commentMode)}
          >
            {commentMode ? 'Cancel placing comment' : 'Add comment'}
          </Button>
          {commentMode ? (
            <p role="status" className="text-ink-soft text-[13px]">
              Click anywhere on the board to place it. Press Esc to cancel.
            </p>
          ) : (
            <Button variant="ghost" size="sm" onClick={placeAtView}>
              Add at selection or centre of view
            </Button>
          )}
        </div>
      ) : null}

      <section aria-labelledby="comments-open" className="flex flex-col gap-1">
        <h3 id="comments-open" className="text-foreground text-[13px] font-medium">
          Open threads <span className="text-ink-soft tabular-nums">{open.length}</span>
        </h3>
        {open.length === 0 ? (
          <p className="text-ink-soft py-1 text-[13px]">
            No open threads. Comments pin to a spot on the board for everyone to see.
          </p>
        ) : (
          <ul className="-mx-2 flex flex-col">{open.map(renderThread)}</ul>
        )}
      </section>

      {resolved.length > 0 ? (
        <section className="border-line flex flex-col gap-1 border-t pt-3">
          <button
            type="button"
            aria-expanded={showResolved}
            onClick={() => setShowResolved((v) => !v)}
            className="text-ink-soft hover:text-foreground self-start text-[13px] font-medium"
          >
            {showResolved ? 'Hide' : 'Show'} resolved ({resolved.length})
          </button>
          {showResolved ? (
            <ul className="-mx-2 flex flex-col">{resolved.map(renderThread)}</ul>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
