// Lightweight realtime signal: when any client adds, resolves, or deletes a
// comment it broadcasts this over the Liveblocks room; peers refetch the
// threads. The comment data itself lives in Postgres, so the event carries no
// payload beyond its type — it is only a "something changed, refetch" nudge.
export type CommentsChangedEvent = {
  type: 'comments-changed';
};

export function isCommentsChangedEvent(data: unknown): data is CommentsChangedEvent {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as Record<string, unknown>).type === 'comments-changed'
  );
}
