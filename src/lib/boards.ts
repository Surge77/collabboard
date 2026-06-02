import { db } from '@/lib/db';
import type { BoardSummary } from '@/types/board';
import type { CreateBoardData, UpdateBoardData } from '@/lib/validations/board';

interface BoardRecord {
  id: string;
  title: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toSummary(board: BoardRecord): BoardSummary {
  return {
    id: board.id,
    title: board.title,
    isPublic: board.isPublic,
    createdAt: board.createdAt.toISOString(),
    updatedAt: board.updatedAt.toISOString(),
  };
}

export async function listBoards(userId: string): Promise<BoardSummary[]> {
  const boards = await db.board.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });
  return boards.map(toSummary);
}

export async function createBoard(userId: string, input: CreateBoardData): Promise<BoardSummary> {
  const board = await db.board.create({
    data: { userId, title: input.title },
  });
  return toSummary(board);
}

export async function getBoard(id: string, userId: string): Promise<BoardSummary | null> {
  // Ownership is part of the lookup: a non-owner gets null, never the record.
  const board = await db.board.findFirst({ where: { id, userId } });
  return board ? toSummary(board) : null;
}

export async function updateBoard(
  id: string,
  userId: string,
  input: UpdateBoardData
): Promise<BoardSummary | null> {
  // updateMany scoped by userId is atomic: ownership is re-asserted in the same
  // query that writes, so there is no TOCTOU window and a missing/unowned board
  // yields count 0 (-> null -> 404) instead of a thrown P2025.
  const result = await db.board.updateMany({
    where: { id, userId },
    data: { title: input.title, isPublic: input.isPublic },
  });
  if (result.count === 0) return null;

  const board = await db.board.findFirst({ where: { id, userId } });
  return board ? toSummary(board) : null;
}

export type BoardRole = 'owner' | 'viewer';

// Resolves view access: the owner gets 'owner', anyone else gets 'viewer' only
// if the board is public, otherwise null (no access). Used by the share/view
// path and the Liveblocks auth endpoint to grant edit vs read-only.
export async function getViewableBoard(
  id: string,
  userId: string
): Promise<{ board: BoardSummary; role: BoardRole } | null> {
  const board = await db.board.findUnique({ where: { id } });
  if (!board) return null;
  if (board.userId === userId) return { board: toSummary(board), role: 'owner' };
  if (board.isPublic) return { board: toSummary(board), role: 'viewer' };
  return null;
}

export async function deleteBoard(id: string, userId: string): Promise<boolean> {
  // deleteMany scoped by userId enforces ownership atomically; count tells us
  // whether anything matched without a separate existence query.
  const result = await db.board.deleteMany({ where: { id, userId } });
  return result.count > 0;
}
