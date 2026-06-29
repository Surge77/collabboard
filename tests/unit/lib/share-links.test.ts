import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    shareLink: {
      create: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { db } from '@/lib/db';
import {
  createShareLink,
  listShareLinks,
  resolveShareToken,
  revokeShareLink,
} from '@/lib/share-links';

const shareLink = db.shareLink as unknown as {
  create: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  updateMany: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createShareLink', () => {
  it('mints a token and computes expiry from days', async () => {
    shareLink.create.mockImplementation(async ({ data }) => ({
      id: 'l1',
      token: data.token,
      role: data.role,
      expiresAt: data.expiresAt,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }));

    const link = await createShareLink('b1', 'u1', 'EDITOR', 7);

    const arg = shareLink.create.mock.calls[0][0].data;
    expect(arg.boardId).toBe('b1');
    expect(arg.role).toBe('EDITOR');
    expect(typeof arg.token).toBe('string');
    expect(arg.token.length).toBeGreaterThan(20);
    expect(arg.expiresAt).toBeInstanceOf(Date);
    expect(link.role).toBe('EDITOR');
  });

  it('rejects an out-of-range expiry (defense in depth)', async () => {
    await expect(createShareLink('b1', 'u1', 'VIEWER', 366)).rejects.toThrow();
    await expect(createShareLink('b1', 'u1', 'VIEWER', 0)).rejects.toThrow();
    expect(shareLink.create).not.toHaveBeenCalled();
  });

  it('leaves expiry null when no duration is given', async () => {
    shareLink.create.mockImplementation(async ({ data }) => ({
      id: 'l1',
      token: data.token,
      role: data.role,
      expiresAt: data.expiresAt,
      createdAt: new Date(),
    }));
    const link = await createShareLink('b1', 'u1', 'VIEWER');
    expect(shareLink.create.mock.calls[0][0].data.expiresAt).toBeNull();
    expect(link.expiresAt).toBeNull();
  });
});

describe('listShareLinks', () => {
  it('lists only active (non-revoked, non-expired) links for the board', async () => {
    shareLink.findMany.mockResolvedValue([]);
    await listShareLinks('b1');
    const call = shareLink.findMany.mock.calls[0][0];
    expect(call.where.boardId).toBe('b1');
    expect(call.where.revoked).toBe(false);
    expect(call.where.OR).toEqual([{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }]);
    expect(call.orderBy).toEqual({ createdAt: 'desc' });
  });
});

describe('revokeShareLink', () => {
  it('scopes the revoke by boardId and reports success', async () => {
    shareLink.updateMany.mockResolvedValue({ count: 1 });
    expect(await revokeShareLink('l1', 'b1')).toBe(true);
    expect(shareLink.updateMany).toHaveBeenCalledWith({
      where: { id: 'l1', boardId: 'b1' },
      data: { revoked: true },
    });
  });

  it('returns false when nothing matched', async () => {
    shareLink.updateMany.mockResolvedValue({ count: 0 });
    expect(await revokeShareLink('l1', 'other')).toBe(false);
  });
});

describe('resolveShareToken', () => {
  it('returns board and role for a live token', async () => {
    shareLink.findUnique.mockResolvedValue({
      boardId: 'b1',
      role: 'EDITOR',
      revoked: false,
      expiresAt: null,
    });
    expect(await resolveShareToken('tok')).toEqual({ boardId: 'b1', role: 'EDITOR' });
  });

  it('returns null for an unknown token', async () => {
    shareLink.findUnique.mockResolvedValue(null);
    expect(await resolveShareToken('tok')).toBeNull();
  });

  it('returns null for a revoked token', async () => {
    shareLink.findUnique.mockResolvedValue({
      boardId: 'b1',
      role: 'VIEWER',
      revoked: true,
      expiresAt: null,
    });
    expect(await resolveShareToken('tok')).toBeNull();
  });

  it('returns null for an expired token', async () => {
    shareLink.findUnique.mockResolvedValue({
      boardId: 'b1',
      role: 'VIEWER',
      revoked: false,
      expiresAt: new Date(Date.now() - 1000),
    });
    expect(await resolveShareToken('tok')).toBeNull();
  });
});
