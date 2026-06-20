import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: { board: { findUnique: vi.fn() } } }));
vi.mock('@/lib/share-links', () => ({ resolveShareToken: vi.fn() }));

import { canEditRole, resolveBoardAccess } from '@/lib/authz';
import { db } from '@/lib/db';
import { resolveShareToken } from '@/lib/share-links';

const findUnique = db.board.findUnique as unknown as ReturnType<typeof vi.fn>;
const resolveToken = resolveShareToken as unknown as ReturnType<typeof vi.fn>;

const baseBoard = {
  id: 'b1',
  title: 'B',
  userId: 'owner1',
  isPublic: false,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

beforeEach(() => {
  vi.clearAllMocks();
  resolveToken.mockResolvedValue(null);
});

describe('resolveBoardAccess', () => {
  it('returns null when the board does not exist', async () => {
    findUnique.mockResolvedValue(null);
    expect(await resolveBoardAccess('b1', 'owner1')).toBeNull();
  });

  it('grants owner to the board owner', async () => {
    findUnique.mockResolvedValue(baseBoard);
    const access = await resolveBoardAccess('b1', 'owner1');
    expect(access?.role).toBe('owner');
  });

  it('grants editor from a valid EDITOR share token', async () => {
    findUnique.mockResolvedValue(baseBoard);
    resolveToken.mockResolvedValue({ boardId: 'b1', role: 'EDITOR' });
    const access = await resolveBoardAccess('b1', 'guest', 'tok');
    expect(access?.role).toBe('editor');
  });

  it('grants viewer from a valid VIEWER share token', async () => {
    findUnique.mockResolvedValue(baseBoard);
    resolveToken.mockResolvedValue({ boardId: 'b1', role: 'VIEWER' });
    const access = await resolveBoardAccess('b1', 'guest', 'tok');
    expect(access?.role).toBe('viewer');
  });

  it('ignores a token issued for a different board', async () => {
    findUnique.mockResolvedValue(baseBoard);
    resolveToken.mockResolvedValue({ boardId: 'other', role: 'EDITOR' });
    expect(await resolveBoardAccess('b1', 'guest', 'tok')).toBeNull();
  });

  it('grants viewer to a non-owner of a public board without a token', async () => {
    findUnique.mockResolvedValue({ ...baseBoard, isPublic: true });
    const access = await resolveBoardAccess('b1', 'guest');
    expect(access?.role).toBe('viewer');
  });

  it('returns null for a non-owner of a private board with no token', async () => {
    findUnique.mockResolvedValue(baseBoard);
    expect(await resolveBoardAccess('b1', 'guest')).toBeNull();
  });
});

describe('canEditRole', () => {
  it('allows owner and editor, denies viewer', () => {
    expect(canEditRole('owner')).toBe(true);
    expect(canEditRole('editor')).toBe(true);
    expect(canEditRole('viewer')).toBe(false);
  });
});
