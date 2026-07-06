'use client';

import { useBroadcastEvent, useEventListener } from '@liveblocks/react/suspense';
import { useCallback, useEffect, useState } from 'react';

import { isCommentsChangedEvent } from '@/lib/comment-events';
import type { CommentNode } from '@/lib/comments';

interface UseComments {
  threads: CommentNode[];
  canComment: boolean;
  addComment: (x: number, y: number, body: string) => Promise<boolean>;
  addReply: (parentId: string, body: string) => Promise<boolean>;
  setResolved: (commentId: string, resolved: boolean) => Promise<boolean>;
  removeComment: (commentId: string) => Promise<boolean>;
}

// Owns comment thread state for a board: initial + realtime fetch (peers
// broadcast a change signal, we refetch) and the four mutations, each of which
// refetches locally and broadcasts so every client converges.
export function useComments(boardId: string, canComment: boolean): UseComments {
  const [threads, setThreads] = useState<CommentNode[]>([]);
  const broadcast = useBroadcastEvent();

  const refetch = useCallback(async () => {
    try {
      const res = await fetch(`/api/boards/${boardId}/comments`);
      if (!res.ok) return;
      const { data } = (await res.json()) as { data: CommentNode[] };
      setThreads(data);
    } catch {
      // A failed refetch leaves the last-known threads in place.
    }
  }, [boardId]);

  // Initial load. refetch's setState runs inside the fetch promise, not
  // synchronously in the effect body, so there is no cascading-render concern —
  // this is the documented "subscribe to an external system" effect shape.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch();
  }, [refetch]);

  useEventListener(({ event }) => {
    if (isCommentsChangedEvent(event)) void refetch();
  });

  const afterMutation = useCallback(async () => {
    await refetch();
    broadcast({ type: 'comments-changed' });
  }, [refetch, broadcast]);

  const post = useCallback(
    async (payload: Record<string, unknown>): Promise<boolean> => {
      const res = await fetch(`/api/boards/${boardId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return false;
      await afterMutation();
      return true;
    },
    [boardId, afterMutation]
  );

  const addComment = useCallback(
    (x: number, y: number, body: string) => post({ x, y, body }),
    [post]
  );

  const addReply = useCallback(
    (parentId: string, body: string) => post({ parentId, body }),
    [post]
  );

  const setResolved = useCallback(
    async (commentId: string, resolved: boolean): Promise<boolean> => {
      const res = await fetch(`/api/boards/${boardId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved }),
      });
      if (!res.ok) return false;
      await afterMutation();
      return true;
    },
    [boardId, afterMutation]
  );

  const removeComment = useCallback(
    async (commentId: string): Promise<boolean> => {
      const res = await fetch(`/api/boards/${boardId}/comments/${commentId}`, { method: 'DELETE' });
      if (!res.ok) return false;
      await afterMutation();
      return true;
    },
    [boardId, afterMutation]
  );

  return { threads, canComment, addComment, addReply, setResolved, removeComment };
}
