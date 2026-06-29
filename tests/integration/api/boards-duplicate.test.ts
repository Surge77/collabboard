import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@liveblocks/node', () => ({
  Liveblocks: vi.fn(function Liveblocks() {
    return {};
  }),
}));
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/boards', () => ({ duplicateBoard: vi.fn() }));
vi.mock('@/lib/liveblocks-server', () => ({ copyBoardCanvas: vi.fn() }));

import { auth } from '@/lib/auth';
import { duplicateBoard } from '@/lib/boards';
import { copyBoardCanvas } from '@/lib/liveblocks-server';
import { POST } from '@/app/api/boards/[id]/duplicate/route';

const authMock = auth as unknown as ReturnType<typeof vi.fn>;

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function post() {
  return new Request('http://localhost/api/boards/b1/duplicate', { method: 'POST' });
}

const copy = {
  id: 'b2',
  title: 'My board (Copy)',
  isPublic: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.stubEnv('LIVEBLOCKS_SECRET_KEY', 'sk_test_dummy');
});

describe('POST /api/boards/[id]/duplicate', () => {
  it('returns 401 when signed out and never duplicates', async () => {
    authMock.mockResolvedValue(null);
    const res = await POST(post(), ctx('b1'));
    expect(res.status).toBe(401);
    expect(duplicateBoard).not.toHaveBeenCalled();
  });

  it('returns 404 when the source board is missing or not owned', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } });
    vi.mocked(duplicateBoard).mockResolvedValue(null);
    const res = await POST(post(), ctx('b1'));
    expect(res.status).toBe(404);
    expect(copyBoardCanvas).not.toHaveBeenCalled();
  });

  it('duplicates the board and copies the canvas when configured', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } });
    vi.mocked(duplicateBoard).mockResolvedValue(copy);
    vi.mocked(copyBoardCanvas).mockResolvedValue(true);
    const res = await POST(post(), ctx('b1'));
    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: { id: string } };
    expect(body.data.id).toBe('b2');
    expect(duplicateBoard).toHaveBeenCalledWith('b1', 'u1');
    expect(copyBoardCanvas).toHaveBeenCalledWith(expect.anything(), 'b1', 'b2');
  });

  it('still succeeds without a Liveblocks key, skipping the canvas copy', async () => {
    vi.stubEnv('LIVEBLOCKS_SECRET_KEY', '');
    authMock.mockResolvedValue({ user: { id: 'u1' } });
    vi.mocked(duplicateBoard).mockResolvedValue(copy);
    const res = await POST(post(), ctx('b1'));
    expect(res.status).toBe(201);
    expect(copyBoardCanvas).not.toHaveBeenCalled();
  });

  it('returns 500 when duplication throws', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } });
    vi.mocked(duplicateBoard).mockRejectedValue(new Error('db down'));
    const res = await POST(post(), ctx('b1'));
    expect(res.status).toBe(500);
  });
});
