import { db } from '@/lib/db';
import type { CreateCommentInput } from '@/lib/validations/comment';

export interface CommentAuthor {
  id: string;
  name: string | null;
  image: string | null;
}

export interface CommentNode {
  id: string;
  body: string;
  x: number | null;
  y: number | null;
  resolved: boolean;
  author: CommentAuthor;
  createdAt: string;
  replies: CommentNode[];
}

interface CommentRecord {
  id: string;
  body: string;
  x: number | null;
  y: number | null;
  resolved: boolean;
  createdAt: Date;
  author: CommentAuthor;
}

function toNode(record: CommentRecord, replies: CommentNode[] = []): CommentNode {
  return {
    id: record.id,
    body: record.body,
    x: record.x,
    y: record.y,
    resolved: record.resolved,
    author: record.author,
    createdAt: record.createdAt.toISOString(),
    replies,
  };
}

const AUTHOR_SELECT = { select: { id: true, name: true, image: true } } as const;

// All threads on a board: root comments (parentId null) newest-first, each with
// its replies oldest-first. Two flat queries + an in-memory group, so reply
// depth is bounded to one level by construction.
export async function listThreads(boardId: string): Promise<CommentNode[]> {
  const [roots, replies] = await Promise.all([
    db.comment.findMany({
      where: { boardId, parentId: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        body: true,
        x: true,
        y: true,
        resolved: true,
        createdAt: true,
        author: AUTHOR_SELECT,
      },
    }),
    db.comment.findMany({
      where: { boardId, parentId: { not: null } },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        body: true,
        x: true,
        y: true,
        resolved: true,
        createdAt: true,
        parentId: true,
        author: AUTHOR_SELECT,
      },
    }),
  ]);

  const repliesByParent = new Map<string, CommentNode[]>();
  for (const reply of replies) {
    if (!reply.parentId) continue;
    const list = repliesByParent.get(reply.parentId) ?? [];
    list.push(toNode(reply));
    repliesByParent.set(reply.parentId, list);
  }

  return roots.map((root) => toNode(root, repliesByParent.get(root.id) ?? []));
}

// Creates a root comment or a reply. A reply's parent must belong to the same
// board and itself be a root (single-level threads), else null → 404 upstream.
export async function createComment(
  boardId: string,
  authorId: string,
  input: CreateCommentInput
): Promise<CommentNode | null> {
  if (input.parentId) {
    const parent = await db.comment.findFirst({
      where: { id: input.parentId, boardId, parentId: null },
      select: { id: true },
    });
    if (!parent) return null;
  }

  const comment = await db.comment.create({
    data: {
      boardId,
      authorId,
      body: input.body,
      x: input.parentId ? null : input.x,
      y: input.parentId ? null : input.y,
      parentId: input.parentId ?? null,
    },
    select: {
      id: true,
      body: true,
      x: true,
      y: true,
      resolved: true,
      createdAt: true,
      author: AUTHOR_SELECT,
    },
  });
  return toNode(comment);
}

// Resolve/unresolve a root comment. Scoped to the board so a comment id from
// another board can't be toggled. Returns false when nothing matched.
export async function setCommentResolved(
  boardId: string,
  commentId: string,
  resolved: boolean
): Promise<boolean> {
  const result = await db.comment.updateMany({
    where: { id: commentId, boardId, parentId: null },
    data: { resolved },
  });
  return result.count > 0;
}

// Deletes a comment (and, via cascade, its replies). Authorization is the
// caller's responsibility: `allowAnyAuthor` is set once the route has confirmed
// board-admin rights; otherwise deletion is restricted to the author's own row.
export async function deleteComment(
  boardId: string,
  commentId: string,
  userId: string,
  allowAnyAuthor: boolean
): Promise<boolean> {
  const result = await db.comment.deleteMany({
    where: {
      id: commentId,
      boardId,
      ...(allowAnyAuthor ? {} : { authorId: userId }),
    },
  });
  return result.count > 0;
}
