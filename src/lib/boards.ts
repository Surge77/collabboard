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

export function toSummary(board: BoardRecord): BoardSummary {
  return {
    id: board.id,
    title: board.title,
    isPublic: board.isPublic,
    createdAt: board.createdAt.toISOString(),
    updatedAt: board.updatedAt.toISOString(),
  };
}

const PERSONAL_ORG_NAME = 'Personal';

// Every board belongs to an organization. Users signing up via OAuth don't get
// one from the adapter, so it's created lazily on first need. The unique
// constraint on personalForUserId makes the upsert race-safe.
export async function ensurePersonalOrg(userId: string): Promise<string> {
  const org = await db.organization.upsert({
    where: { personalForUserId: userId },
    update: {},
    create: {
      name: PERSONAL_ORG_NAME,
      personalForUserId: userId,
      members: { create: { userId, role: 'ADMIN' } },
    },
  });
  return org.id;
}

// Boards the user can see in the dashboard: boards they created, boards they
// were explicitly added to, and boards in orgs they belong to. Soft-deleted
// boards are excluded everywhere.
export async function listBoards(userId: string): Promise<BoardSummary[]> {
  const boards = await db.board.findMany({
    where: {
      deletedAt: null,
      OR: [
        { createdById: userId },
        { members: { some: { userId } } },
        { org: { members: { some: { userId } } } },
      ],
    },
    orderBy: { updatedAt: 'desc' },
  });
  return boards.map(toSummary);
}

export async function createBoard(userId: string, input: CreateBoardData): Promise<BoardSummary> {
  const orgId = await ensurePersonalOrg(userId);
  const board = await db.board.create({
    // userId kept in sync with createdById until the legacy column is dropped.
    data: { userId, createdById: userId, orgId, title: input.title },
  });
  return toSummary(board);
}

// By-id mutations below carry no access check of their own: every caller must
// gate through resolveBoardAccess first (role semantics live in the routes).

export async function updateBoard(
  id: string,
  input: UpdateBoardData
): Promise<BoardSummary | null> {
  const result = await db.board.updateMany({
    where: { id, deletedAt: null },
    data: { title: input.title, isPublic: input.isPublic, lastActivityAt: new Date() },
  });
  if (result.count === 0) return null;

  const board = await db.board.findFirst({ where: { id } });
  return board ? toSummary(board) : null;
}

// Suffix appended to a duplicated board's title so the copy is distinguishable
// in the dashboard list.
const COPY_SUFFIX = ' (Copy)';

// Clones a source board's row into a fresh private board owned by the caller,
// in the caller's personal org. Access to the SOURCE must already have been
// checked by the caller (resolveBoardAccess); this only owns the new DB row.
export async function duplicateBoard(sourceTitle: string, userId: string): Promise<BoardSummary> {
  const orgId = await ensurePersonalOrg(userId);
  const copy = await db.board.create({
    data: { userId, createdById: userId, orgId, title: `${sourceTitle}${COPY_SUFFIX}` },
  });
  return toSummary(copy);
}

export async function deleteBoard(id: string): Promise<boolean> {
  // Soft delete; already-deleted boards yield count 0 so a repeat call 404s.
  const result = await db.board.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return result.count > 0;
}
