import { beforeEach, describe, expect, it, vi } from 'vitest';

// vi.mock is hoisted above module scope, so the mock's dependencies must be
// created inside vi.hoisted to avoid a temporal-dead-zone reference error.
const { allow, prepareSession } = vi.hoisted(() => {
  const authorize = vi.fn(async () => ({ body: '{"token":"t"}', status: 200 }));
  const allow = vi.fn();
  const prepareSession = vi.fn(() => ({
    allow,
    FULL_ACCESS: 'room:write',
    READ_ACCESS: 'room:read',
    authorize,
  }));
  return { allow, prepareSession };
});

vi.mock('@liveblocks/node', () => ({
  Liveblocks: vi.fn(function Liveblocks() {
    return { prepareSession };
  }),
}));
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/boards', () => ({ getViewableBoard: vi.fn() }));

import { auth } from '@/lib/auth';
import { getViewableBoard } from '@/lib/boards';
import { POST } from '@/app/api/liveblocks-auth/route';

const authMock = auth as unknown as ReturnType<typeof vi.fn>;
const ROOM = 'collabboard:board:ckx7p2m9q4r8s1t3u5v7w9y2z';

function req(body: unknown) {
  return new Request('http://localhost/api/liveblocks-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function signedIn() {
  authMock.mockResolvedValue({ user: { id: 'u1', name: 'Ana' } });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('LIVEBLOCKS_SECRET_KEY', 'sk_test_dummy');
});

describe('POST /api/liveblocks-auth', () => {
  it('returns 401 when signed out and never checks the board', async () => {
    authMock.mockResolvedValue(null);
    const res = await POST(req({ room: ROOM }));
    expect(res.status).toBe(401);
    expect(getViewableBoard).not.toHaveBeenCalled();
  });

  it('returns 400 for a room id outside the board namespace', async () => {
    signedIn();
    const res = await POST(req({ room: 'liveblocks:examples:x' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when no room is provided', async () => {
    signedIn();
    const res = await POST(req({}));
    expect(res.status).toBe(400);
  });

  it('returns 403 when the board is not viewable', async () => {
    signedIn();
    vi.mocked(getViewableBoard).mockResolvedValue(null);
    const res = await POST(req({ room: ROOM }));
    expect(res.status).toBe(403);
    expect(allow).not.toHaveBeenCalled();
  });

  const board = {
    id: 'b1',
    title: 'B',
    isPublic: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  it('grants the owner full (edit) access to their room', async () => {
    signedIn();
    vi.mocked(getViewableBoard).mockResolvedValue({ board, role: 'owner' });
    const res = await POST(req({ room: ROOM }));
    expect(res.status).toBe(200);
    expect(prepareSession).toHaveBeenCalledWith('u1', expect.anything());
    expect(allow).toHaveBeenCalledWith(ROOM, 'room:write');
  });

  it('grants a public viewer read-only access', async () => {
    signedIn();
    vi.mocked(getViewableBoard).mockResolvedValue({
      board: { ...board, isPublic: true },
      role: 'viewer',
    });
    const res = await POST(req({ room: ROOM }));
    expect(res.status).toBe(200);
    expect(allow).toHaveBeenCalledWith(ROOM, 'room:read');
  });
});
