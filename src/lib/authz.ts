import { toSummary } from '@/lib/boards';
import { db } from '@/lib/db';
import { resolveShareToken } from '@/lib/share-links';
import type { BoardSummary } from '@/types/board';

export type BoardAccessRole = 'owner' | 'editor' | 'viewer';

export interface BoardAccess {
  board: BoardSummary;
  role: BoardAccessRole;
}

// The single source of truth for "can this user touch this board, and how".
// Precedence: board owner → a valid share token for THIS board → the legacy
// public flag (read-only) → no access. Used by the board page and the Liveblocks
// auth endpoint so the UI gate and the realtime token can never disagree.
export async function resolveBoardAccess(
  boardId: string,
  userId: string,
  shareToken?: string | null
): Promise<BoardAccess | null> {
  const board = await db.board.findUnique({ where: { id: boardId } });
  if (!board) return null;

  if (board.userId === userId) {
    return { board: toSummary(board), role: 'owner' };
  }

  if (shareToken) {
    const link = await resolveShareToken(shareToken);
    if (link && link.boardId === boardId) {
      return { board: toSummary(board), role: link.role === 'EDITOR' ? 'editor' : 'viewer' };
    }
  }

  if (board.isPublic) {
    return { board: toSummary(board), role: 'viewer' };
  }

  return null;
}

export function canEditRole(role: BoardAccessRole): boolean {
  return role === 'owner' || role === 'editor';
}
