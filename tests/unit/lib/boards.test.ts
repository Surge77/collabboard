import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    board: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    organization: {
      upsert: vi.fn(),
    },
  },
}));

import { db } from '@/lib/db';
import {
  createBoard,
  deleteBoard,
  duplicateBoard,
  ensurePersonalOrg,
  listBoards,
  updateBoard,
} from '@/lib/boards';

const board = {
  id: 'b1',
  title: 'My board',
  isPublic: false,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};

const mockDb = db as unknown as {
  board: {
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  organization: {
    upsert: ReturnType<typeof vi.fn>;
  };
};

beforeEach(() => {
  vi.clearAllMocks();
  mockDb.organization.upsert.mockResolvedValue({ id: 'org1' });
});

describe('ensurePersonalOrg', () => {
  it('upserts the personal org keyed by personalForUserId', async () => {
    expect(await ensurePersonalOrg('u1')).toBe('org1');
    expect(mockDb.organization.upsert).toHaveBeenCalledWith({
      where: { personalForUserId: 'u1' },
      update: {},
      create: {
        name: 'Personal',
        personalForUserId: 'u1',
        members: { create: { userId: 'u1', role: 'ADMIN' } },
      },
    });
  });
});

describe('listBoards', () => {
  it('lists created, member, and org boards, excluding soft-deleted', async () => {
    mockDb.board.findMany.mockResolvedValue([board]);
    const result = await listBoards('u1');
    expect(mockDb.board.findMany).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        OR: [
          { createdById: 'u1' },
          { members: { some: { userId: 'u1' } } },
          { org: { members: { some: { userId: 'u1' } } } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });
    expect(result[0]).toEqual({
      id: 'b1',
      title: 'My board',
      isPublic: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    });
  });
});

describe('createBoard', () => {
  it('creates a board in the personal org with creator columns in sync', async () => {
    mockDb.board.create.mockResolvedValue(board);
    const result = await createBoard('u1', { title: 'My board' });
    expect(mockDb.board.create).toHaveBeenCalledWith({
      data: { userId: 'u1', createdById: 'u1', orgId: 'org1', title: 'My board' },
    });
    expect(result.id).toBe('b1');
  });
});

describe('updateBoard', () => {
  it('updates a live board atomically via updateMany', async () => {
    mockDb.board.updateMany.mockResolvedValue({ count: 1 });
    mockDb.board.findFirst.mockResolvedValue({ ...board, title: 'Renamed' });
    const result = await updateBoard('b1', { title: 'Renamed' });
    expect(mockDb.board.updateMany).toHaveBeenCalledWith({
      where: { id: 'b1', deletedAt: null },
      data: { title: 'Renamed', isPublic: undefined, lastActivityAt: expect.any(Date) },
    });
    expect(result?.title).toBe('Renamed');
  });

  it('returns null without re-fetching for a missing or deleted board', async () => {
    mockDb.board.updateMany.mockResolvedValue({ count: 0 });
    const result = await updateBoard('b1', { title: 'x' });
    expect(result).toBeNull();
    expect(mockDb.board.findFirst).not.toHaveBeenCalled();
  });
});

describe('duplicateBoard', () => {
  it('creates a fresh private "(Copy)" in the caller’s personal org', async () => {
    mockDb.board.create.mockResolvedValue({ ...board, id: 'b2', title: 'My board (Copy)' });
    const result = await duplicateBoard('My board', 'u1');
    expect(mockDb.board.create).toHaveBeenCalledWith({
      data: { userId: 'u1', createdById: 'u1', orgId: 'org1', title: 'My board (Copy)' },
    });
    expect(result.id).toBe('b2');
    expect(result.title).toBe('My board (Copy)');
  });
});

describe('deleteBoard', () => {
  it('soft-deletes and returns true when a board matched', async () => {
    mockDb.board.updateMany.mockResolvedValue({ count: 1 });
    expect(await deleteBoard('b1')).toBe(true);
    expect(mockDb.board.updateMany).toHaveBeenCalledWith({
      where: { id: 'b1', deletedAt: null },
      data: { deletedAt: expect.any(Date) },
    });
  });

  it('returns false when nothing matched (missing or already deleted)', async () => {
    mockDb.board.updateMany.mockResolvedValue({ count: 0 });
    expect(await deleteBoard('b1')).toBe(false);
  });
});
