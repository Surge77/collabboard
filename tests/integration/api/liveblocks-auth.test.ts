import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
vi.mock('@/lib/authz', () => ({
  resolveBoardAccess: vi.fn(),
  canEditRole: (role: string) => role === 'owner' || role === 'editor',
}));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn(async () => true) }));

import { auth } from '@/lib/auth';
import { resolveBoardAccess } from '@/lib/authz';
import { rateLimit } from '@/lib/rate-limit';
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
  vi.mocked(rateLimit).mockResolvedValue(true);
  vi.stubEnv('LIVEBLOCKS_SECRET_KEY', 'sk_test_dummy');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/liveblocks-auth', () => {
  it('returns 401 when signed out and never checks the board', async () => {
    authMock.mockResolvedValue(null);
    const res = await POST(req({ room: ROOM }));
    expect(res.status).toBe(401);
    expect(resolveBoardAccess).not.toHaveBeenCalled();
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

  it('returns 403 when the board is not accessible', async () => {
    signedIn();
    vi.mocked(resolveBoardAccess).mockResolvedValue(null);
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
    vi.mocked(resolveBoardAccess).mockResolvedValue({ board, role: 'owner' });
    const res = await POST(req({ room: ROOM }));
    expect(res.status).toBe(200);
    expect(prepareSession).toHaveBeenCalledWith('u1', expect.anything());
    expect(allow).toHaveBeenCalledWith(ROOM, 'room:write');
  });

  it('grants a share-link editor full (edit) access', async () => {
    signedIn();
    vi.mocked(resolveBoardAccess).mockResolvedValue({ board, role: 'editor' });
    const res = await POST(req({ room: ROOM, token: 'tok' }));
    expect(res.status).toBe(200);
    expect(resolveBoardAccess).toHaveBeenCalledWith('ckx7p2m9q4r8s1t3u5v7w9y2z', 'u1', 'tok');
    expect(allow).toHaveBeenCalledWith(ROOM, 'room:write');
  });

  it('grants a viewer read-only access', async () => {
    signedIn();
    vi.mocked(resolveBoardAccess).mockResolvedValue({
      board: { ...board, isPublic: true },
      role: 'viewer',
    });
    const res = await POST(req({ room: ROOM }));
    expect(res.status).toBe(200);
    expect(allow).toHaveBeenCalledWith(ROOM, 'room:read');
  });

  it('returns 429 when rate limited and never checks access', async () => {
    signedIn();
    vi.mocked(rateLimit).mockResolvedValue(false);
    const res = await POST(req({ room: ROOM }));
    expect(res.status).toBe(429);
    expect(resolveBoardAccess).not.toHaveBeenCalled();
  });

  it('returns 500 when the realtime secret is not configured', async () => {
    signedIn();
    vi.stubEnv('LIVEBLOCKS_SECRET_KEY', '');
    vi.mocked(resolveBoardAccess).mockResolvedValue({ board, role: 'owner' });
    const res = await POST(req({ room: ROOM }));
    expect(res.status).toBe(500);
    expect(allow).not.toHaveBeenCalled();
  });
});
