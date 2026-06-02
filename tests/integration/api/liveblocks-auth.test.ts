import { beforeEach, describe, expect, it, vi } from 'vitest';

// vi.mock is hoisted above module scope, so the mock's dependencies must be
// created inside vi.hoisted to avoid a temporal-dead-zone reference error.
const { allow, prepareSession } = vi.hoisted(() => {
  const authorize = vi.fn(async () => ({ body: '{"token":"t"}', status: 200 }));
  const allow = vi.fn();
  const prepareSession = vi.fn(() => ({ allow, FULL_ACCESS: 'room:write', authorize }));
  return { allow, prepareSession };
});

vi.mock('@liveblocks/node', () => ({
  Liveblocks: vi.fn(function Liveblocks() {
    return { prepareSession };
  }),
}));
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/boards', () => ({ getBoard: vi.fn() }));

import { auth } from '@/lib/auth';
import { getBoard } from '@/lib/boards';
import { POST } from '@/app/api/liveblocks-auth/route';

const authMock = auth as unknown as ReturnType<typeof vi.fn>;
const ROOM = 'collabboard:board:b1';

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
});

describe('POST /api/liveblocks-auth', () => {
  it('returns 401 when signed out and never checks the board', async () => {
    authMock.mockResolvedValue(null);
    const res = await POST(req({ room: ROOM }));
    expect(res.status).toBe(401);
    expect(getBoard).not.toHaveBeenCalled();
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

  it('returns 403 when the user does not own the board', async () => {
    signedIn();
    vi.mocked(getBoard).mockResolvedValue(null);
    const res = await POST(req({ room: ROOM }));
    expect(res.status).toBe(403);
    expect(allow).not.toHaveBeenCalled();
  });

  it('authorizes the owner for exactly their room', async () => {
    signedIn();
    vi.mocked(getBoard).mockResolvedValue({
      id: 'b1',
      title: 'B',
      isPublic: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const res = await POST(req({ room: ROOM }));
    expect(res.status).toBe(200);
    expect(prepareSession).toHaveBeenCalledWith('u1', expect.anything());
    expect(allow).toHaveBeenCalledWith(ROOM, 'room:write');
  });
});
