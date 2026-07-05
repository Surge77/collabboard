import { toSummary } from '@/lib/boards';
import { db } from '@/lib/db';
import { resolveShareToken } from '@/lib/share-links';
import type { BoardRole, BoardSummary } from '@/types/board';

// Unified role model. 'admin' covers the board creator, explicit BoardMember
// admins, and org admins; there is no separate 'owner' — creator ⇒ admin.
export type BoardAccessRole = BoardRole;

export interface BoardAccess {
  board: BoardSummary;
  role: BoardAccessRole;
}

const BOARD_MEMBER_ROLE: Record<string, BoardAccessRole> = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  COMMENTER: 'commenter',
  VIEWER: 'viewer',
};

// The single source of truth for "can this user touch this board, and how".
// Precedence (most specific wins):
//   creator → explicit BoardMember grant → org membership (ADMIN ⇒ admin,
//   MEMBER ⇒ editor) → a valid share token for THIS board → the legacy public
//   flag (read-only) → no access.
// Used by the board page, the board API routes, and the Liveblocks auth
// endpoint so the UI gate and the realtime token can never disagree.
export async function resolveBoardAccess(
  boardId: string,
  userId: string,
  shareToken?: string | null
): Promise<BoardAccess | null> {
  const board = await db.board.findUnique({
    where: { id: boardId },
    include: {
      members: { where: { userId } },
      org: { include: { members: { where: { userId } } } },
    },
  });
  if (!board || board.deletedAt) return null;

  if (board.createdById === userId) {
    return { board: toSummary(board), role: 'admin' };
  }

  const memberGrant = board.members[0];
  if (memberGrant) {
    return { board: toSummary(board), role: BOARD_MEMBER_ROLE[memberGrant.role] ?? 'viewer' };
  }

  const orgGrant = board.org.members[0];
  if (orgGrant) {
    return { board: toSummary(board), role: orgGrant.role === 'ADMIN' ? 'admin' : 'editor' };
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

export { canCommentRole, canEditRole, isAdminRole } from '@/lib/board-roles';
