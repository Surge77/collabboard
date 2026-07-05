import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/authz', () => ({
  resolveBoardAccess: vi.fn(),
  isAdminRole: (role: string) => role === 'admin',
}));
vi.mock('@/lib/share-links', () => ({
  createShareLink: vi.fn(),
  listShareLinks: vi.fn(),
  revokeShareLink: vi.fn(),
}));

import { auth } from '@/lib/auth';
import { resolveBoardAccess } from '@/lib/authz';
import { createShareLink, listShareLinks, revokeShareLink } from '@/lib/share-links';
import { DELETE, GET, POST } from '@/app/api/boards/[id]/share-links/route';

const authMock = auth as unknown as ReturnType<typeof vi.fn>;
const ctx = { params: Promise.resolve({ id: 'b1' }) };

function req(body?: unknown, search = '') {
  return new Request(`http://localhost/api/boards/b1/share-links${search}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function signedIn() {
  authMock.mockResolvedValue({ user: { id: 'u1' } });
}

const ownedBoard = {
  id: 'b1',
  title: 'B',
  isPublic: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/boards/[id]/share-links', () => {
  it('returns 401 when signed out', async () => {
    authMock.mockResolvedValue(null);
    expect((await POST(req({ role: 'VIEWER' }), ctx)).status).toBe(401);
  });

  it('returns 422 for an invalid role', async () => {
    signedIn();
    expect((await POST(req({ role: 'GOD' }), ctx)).status).toBe(422);
  });

  it('returns 404 when the caller is not a board admin', async () => {
    signedIn();
    vi.mocked(resolveBoardAccess).mockResolvedValue(null);
    expect((await POST(req({ role: 'VIEWER' }), ctx)).status).toBe(404);
    expect(createShareLink).not.toHaveBeenCalled();
  });

  it('creates a link for an owned board', async () => {
    signedIn();
    vi.mocked(resolveBoardAccess).mockResolvedValue({ board: ownedBoard, role: 'admin' });
    vi.mocked(createShareLink).mockResolvedValue({
      id: 'l1',
      token: 'tok',
      role: 'EDITOR',
      expiresAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    const res = await POST(req({ role: 'EDITOR' }), ctx);
    expect(res.status).toBe(201);
    expect(createShareLink).toHaveBeenCalledWith('b1', 'u1', 'EDITOR', undefined);
  });
});

describe('GET /api/boards/[id]/share-links', () => {
  it('returns 401 when signed out', async () => {
    authMock.mockResolvedValue(null);
    expect((await GET(req(), ctx)).status).toBe(401);
  });

  it('returns 404 when the caller is not a board admin', async () => {
    signedIn();
    vi.mocked(resolveBoardAccess).mockResolvedValue(null);
    expect((await GET(req(), ctx)).status).toBe(404);
    expect(listShareLinks).not.toHaveBeenCalled();
  });

  it('lists links for an owned board', async () => {
    signedIn();
    vi.mocked(resolveBoardAccess).mockResolvedValue({ board: ownedBoard, role: 'admin' });
    vi.mocked(listShareLinks).mockResolvedValue([]);
    expect((await GET(req(), ctx)).status).toBe(200);
  });
});

describe('DELETE /api/boards/[id]/share-links', () => {
  it('returns 401 when signed out', async () => {
    authMock.mockResolvedValue(null);
    expect((await DELETE(req(undefined, '?linkId=l1'), ctx)).status).toBe(401);
  });

  it('returns 404 when the link does not belong to the board', async () => {
    signedIn();
    vi.mocked(resolveBoardAccess).mockResolvedValue({ board: ownedBoard, role: 'admin' });
    vi.mocked(revokeShareLink).mockResolvedValue(false);
    expect((await DELETE(req(undefined, '?linkId=ghost'), ctx)).status).toBe(404);
  });

  it('returns 422 when linkId is missing', async () => {
    signedIn();
    vi.mocked(resolveBoardAccess).mockResolvedValue({ board: ownedBoard, role: 'admin' });
    expect((await DELETE(req(), ctx)).status).toBe(422);
  });

  it('returns 404 when the caller is not a board admin', async () => {
    signedIn();
    vi.mocked(resolveBoardAccess).mockResolvedValue(null);
    expect((await DELETE(req(undefined, '?linkId=l1'), ctx)).status).toBe(404);
    expect(revokeShareLink).not.toHaveBeenCalled();
  });

  it('revokes a link for an owned board', async () => {
    signedIn();
    vi.mocked(resolveBoardAccess).mockResolvedValue({ board: ownedBoard, role: 'admin' });
    vi.mocked(revokeShareLink).mockResolvedValue(true);
    const res = await DELETE(req(undefined, '?linkId=l1'), ctx);
    expect(res.status).toBe(200);
    expect(revokeShareLink).toHaveBeenCalledWith('l1', 'b1');
  });
});
