import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: { board: { findUnique: vi.fn() } } }));
vi.mock('@/lib/share-links', () => ({ resolveShareToken: vi.fn() }));

import { canCommentRole, canEditRole, isAdminRole, resolveBoardAccess } from '@/lib/authz';
import { db } from '@/lib/db';
import { resolveShareToken } from '@/lib/share-links';

const findUnique = db.board.findUnique as unknown as ReturnType<typeof vi.fn>;
const resolveToken = resolveShareToken as unknown as ReturnType<typeof vi.fn>;

// Shape returned by the authz query: board + the caller's BoardMember rows and
// the caller's org membership rows (both filtered to the caller by the query).
function board(overrides: Record<string, unknown> = {}) {
  return {
    id: 'b1',
    title: 'B',
    userId: 'creator1',
    createdById: 'creator1',
    orgId: 'org1',
    isPublic: false,
    deletedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    members: [],
    org: { id: 'org1', members: [] },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  resolveToken.mockResolvedValue(null);
});

describe('resolveBoardAccess', () => {
  it('returns null when the board does not exist', async () => {
    findUnique.mockResolvedValue(null);
    expect(await resolveBoardAccess('b1', 'creator1')).toBeNull();
  });

  it('returns null for a soft-deleted board, even for its creator', async () => {
    findUnique.mockResolvedValue(board({ deletedAt: new Date() }));
    expect(await resolveBoardAccess('b1', 'creator1')).toBeNull();
  });

  it('grants admin to the board creator', async () => {
    findUnique.mockResolvedValue(board());
    const access = await resolveBoardAccess('b1', 'creator1');
    expect(access?.role).toBe('admin');
  });

  it('grants the explicit BoardMember role to a member', async () => {
    findUnique.mockResolvedValue(board({ members: [{ userId: 'u2', role: 'COMMENTER' }] }));
    const access = await resolveBoardAccess('b1', 'u2');
    expect(access?.role).toBe('commenter');
  });

  it('prefers the BoardMember grant over the org role', async () => {
    findUnique.mockResolvedValue(
      board({
        members: [{ userId: 'u2', role: 'VIEWER' }],
        org: { id: 'org1', members: [{ userId: 'u2', role: 'ADMIN' }] },
      })
    );
    const access = await resolveBoardAccess('b1', 'u2');
    expect(access?.role).toBe('viewer');
  });

  it('grants admin to an org ADMIN without an explicit board grant', async () => {
    findUnique.mockResolvedValue(board({ org: { id: 'org1', members: [{ role: 'ADMIN' }] } }));
    const access = await resolveBoardAccess('b1', 'u2');
    expect(access?.role).toBe('admin');
  });

  it('grants editor to an org MEMBER without an explicit board grant', async () => {
    findUnique.mockResolvedValue(board({ org: { id: 'org1', members: [{ role: 'MEMBER' }] } }));
    const access = await resolveBoardAccess('b1', 'u2');
    expect(access?.role).toBe('editor');
  });

  it('grants editor from a valid EDITOR share token', async () => {
    findUnique.mockResolvedValue(board());
    resolveToken.mockResolvedValue({ boardId: 'b1', role: 'EDITOR' });
    const access = await resolveBoardAccess('b1', 'guest', 'tok');
    expect(access?.role).toBe('editor');
  });

  it('grants viewer from a valid VIEWER share token', async () => {
    findUnique.mockResolvedValue(board());
    resolveToken.mockResolvedValue({ boardId: 'b1', role: 'VIEWER' });
    const access = await resolveBoardAccess('b1', 'guest', 'tok');
    expect(access?.role).toBe('viewer');
  });

  it('ignores a token issued for a different board', async () => {
    findUnique.mockResolvedValue(board());
    resolveToken.mockResolvedValue({ boardId: 'other', role: 'EDITOR' });
    expect(await resolveBoardAccess('b1', 'guest', 'tok')).toBeNull();
  });

  it('grants viewer to a stranger on a public board without a token', async () => {
    findUnique.mockResolvedValue(board({ isPublic: true }));
    const access = await resolveBoardAccess('b1', 'guest');
    expect(access?.role).toBe('viewer');
  });

  it('returns null for a stranger on a private board with no token', async () => {
    findUnique.mockResolvedValue(board());
    expect(await resolveBoardAccess('b1', 'guest')).toBeNull();
  });
});

describe('role predicates', () => {
  it('canEditRole allows admin and editor, denies commenter and viewer', () => {
    expect(canEditRole('admin')).toBe(true);
    expect(canEditRole('editor')).toBe(true);
    expect(canEditRole('commenter')).toBe(false);
    expect(canEditRole('viewer')).toBe(false);
  });

  it('canCommentRole allows commenter and above, denies viewer', () => {
    expect(canCommentRole('admin')).toBe(true);
    expect(canCommentRole('commenter')).toBe(true);
    expect(canCommentRole('viewer')).toBe(false);
  });

  it('isAdminRole allows only admin', () => {
    expect(isAdminRole('admin')).toBe(true);
    expect(isAdminRole('editor')).toBe(false);
  });
});
