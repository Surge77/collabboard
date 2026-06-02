import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    board: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { db } from '@/lib/db';
import {
  createBoard,
  deleteBoard,
  getBoard,
  getViewableBoard,
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
    deleteMany: ReturnType<typeof vi.fn>;
  };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('listBoards', () => {
  it('returns summaries with ISO date strings, newest first', async () => {
    mockDb.board.findMany.mockResolvedValue([board]);
    const result = await listBoards('u1');
    expect(mockDb.board.findMany).toHaveBeenCalledWith({
      where: { userId: 'u1' },
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
  it('creates a board scoped to the user', async () => {
    mockDb.board.create.mockResolvedValue(board);
    const result = await createBoard('u1', { title: 'My board' });
    expect(mockDb.board.create).toHaveBeenCalledWith({
      data: { userId: 'u1', title: 'My board' },
    });
    expect(result.id).toBe('b1');
  });
});

describe('getBoard', () => {
  it('returns the board when the user owns it', async () => {
    mockDb.board.findFirst.mockResolvedValue(board);
    expect(await getBoard('b1', 'u1')).not.toBeNull();
    expect(mockDb.board.findFirst).toHaveBeenCalledWith({
      where: { id: 'b1', userId: 'u1' },
    });
  });

  it('returns null when the board is not owned', async () => {
    mockDb.board.findFirst.mockResolvedValue(null);
    expect(await getBoard('b1', 'intruder')).toBeNull();
  });
});

describe('updateBoard', () => {
  it('updates an owned board atomically via updateMany', async () => {
    mockDb.board.updateMany.mockResolvedValue({ count: 1 });
    mockDb.board.findFirst.mockResolvedValue({ ...board, title: 'Renamed' });
    const result = await updateBoard('b1', 'u1', { title: 'Renamed' });
    expect(mockDb.board.updateMany).toHaveBeenCalledWith({
      where: { id: 'b1', userId: 'u1' },
      data: { title: 'Renamed', isPublic: undefined },
    });
    expect(result?.title).toBe('Renamed');
  });

  it('returns null without re-fetching when not owned', async () => {
    mockDb.board.updateMany.mockResolvedValue({ count: 0 });
    const result = await updateBoard('b1', 'intruder', { title: 'x' });
    expect(result).toBeNull();
    expect(mockDb.board.findFirst).not.toHaveBeenCalled();
  });
});

describe('getViewableBoard', () => {
  const ownedRecord = { ...board, userId: 'u1' };

  it('returns owner role for the board owner', async () => {
    mockDb.board.findUnique.mockResolvedValue(ownedRecord);
    const result = await getViewableBoard('b1', 'u1');
    expect(result).toEqual({ board: expect.objectContaining({ id: 'b1' }), role: 'owner' });
  });

  it('returns viewer role for a non-owner when the board is public', async () => {
    mockDb.board.findUnique.mockResolvedValue({ ...ownedRecord, isPublic: true });
    const result = await getViewableBoard('b1', 'someone-else');
    expect(result?.role).toBe('viewer');
  });

  it('returns null for a non-owner of a private board', async () => {
    mockDb.board.findUnique.mockResolvedValue({ ...ownedRecord, isPublic: false });
    expect(await getViewableBoard('b1', 'someone-else')).toBeNull();
  });

  it('returns null when the board does not exist', async () => {
    mockDb.board.findUnique.mockResolvedValue(null);
    expect(await getViewableBoard('missing', 'u1')).toBeNull();
  });
});

describe('deleteBoard', () => {
  it('returns true when a board was deleted', async () => {
    mockDb.board.deleteMany.mockResolvedValue({ count: 1 });
    expect(await deleteBoard('b1', 'u1')).toBe(true);
    expect(mockDb.board.deleteMany).toHaveBeenCalledWith({
      where: { id: 'b1', userId: 'u1' },
    });
  });

  it('returns false when nothing matched', async () => {
    mockDb.board.deleteMany.mockResolvedValue({ count: 0 });
    expect(await deleteBoard('b1', 'intruder')).toBe(false);
  });
});
