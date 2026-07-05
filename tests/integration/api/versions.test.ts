import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@liveblocks/node', () => ({
  Liveblocks: vi.fn(function Liveblocks() {
    return {};
  }),
}));
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/authz', () => ({
  resolveBoardAccess: vi.fn(),
  canEditRole: (role: string) => role === 'admin' || role === 'editor',
}));
vi.mock('@/lib/board-versions', () => ({
  listVersions: vi.fn(),
  saveVersion: vi.fn(),
  restoreVersion: vi.fn(),
}));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn(async () => true) }));

import { auth } from '@/lib/auth';
import { resolveBoardAccess } from '@/lib/authz';
import { listVersions, restoreVersion, saveVersion } from '@/lib/board-versions';
import { rateLimit } from '@/lib/rate-limit';
import { GET, POST } from '@/app/api/boards/[id]/versions/route';
import { POST as RESTORE } from '@/app/api/boards/[id]/versions/[versionId]/restore/route';

const authMock = auth as unknown as ReturnType<typeof vi.fn>;
const summary = {
  id: 'b1',
  title: 'B',
  isPublic: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function signedIn() {
  authMock.mockResolvedValue({ user: { id: 'u1' } });
}
function grant(role: string) {
  vi.mocked(resolveBoardAccess).mockResolvedValue({ board: summary, role: role as never });
}
const ctx = { params: Promise.resolve({ id: 'b1' }) };
const restoreCtx = { params: Promise.resolve({ id: 'b1', versionId: 'v1' }) };
function post(body: unknown = {}) {
  return new Request('http://localhost/api/boards/b1/versions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.stubEnv('LIVEBLOCKS_SECRET_KEY', 'sk_test_dummy');
});

describe('GET /api/boards/[id]/versions', () => {
  it('returns 401 when signed out', async () => {
    authMock.mockResolvedValue(null);
    expect((await GET(post(), ctx)).status).toBe(401);
  });

  it('returns 404 when the caller has no access', async () => {
    signedIn();
    vi.mocked(resolveBoardAccess).mockResolvedValue(null);
    expect((await GET(post(), ctx)).status).toBe(404);
    expect(listVersions).not.toHaveBeenCalled();
  });

  it('lists versions for any resolved role (viewer included)', async () => {
    signedIn();
    grant('viewer');
    vi.mocked(listVersions).mockResolvedValue([]);
    expect((await GET(post(), ctx)).status).toBe(200);
    expect(listVersions).toHaveBeenCalledWith('b1');
  });
});

describe('POST /api/boards/[id]/versions', () => {
  it('returns 404 for a viewer and never saves', async () => {
    signedIn();
    grant('viewer');
    expect((await POST(post(), ctx)).status).toBe(404);
    expect(saveVersion).not.toHaveBeenCalled();
  });

  it('saves a version for an editor', async () => {
    signedIn();
    grant('editor');
    vi.mocked(saveVersion).mockResolvedValue({
      id: 'v1',
      label: null,
      createdById: 'u1',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    const res = await POST(post({ label: 'checkpoint' }), ctx);
    expect(res.status).toBe(201);
    expect(saveVersion).toHaveBeenCalledWith(expect.anything(), 'b1', 'u1', 'checkpoint');
  });

  it('returns 409 when the canvas is empty', async () => {
    signedIn();
    grant('admin');
    vi.mocked(saveVersion).mockResolvedValue(null);
    expect((await POST(post(), ctx)).status).toBe(409);
  });

  it('returns 429 and never saves when rate-limited', async () => {
    signedIn();
    grant('editor');
    vi.mocked(rateLimit).mockResolvedValueOnce(false);
    expect((await POST(post(), ctx)).status).toBe(429);
    expect(saveVersion).not.toHaveBeenCalled();
  });
});

describe('POST /api/boards/[id]/versions/[versionId]/restore', () => {
  it('returns 404 for a viewer and never restores', async () => {
    signedIn();
    grant('viewer');
    expect((await RESTORE(new Request('http://localhost'), restoreCtx)).status).toBe(404);
    expect(restoreVersion).not.toHaveBeenCalled();
  });

  it('restores for an editor', async () => {
    signedIn();
    grant('editor');
    vi.mocked(restoreVersion).mockResolvedValue(true);
    const res = await RESTORE(new Request('http://localhost'), restoreCtx);
    expect(res.status).toBe(200);
    expect(restoreVersion).toHaveBeenCalledWith(expect.anything(), 'b1', 'v1');
  });

  it('returns 404 when the version is unknown', async () => {
    signedIn();
    grant('editor');
    vi.mocked(restoreVersion).mockResolvedValue(false);
    expect((await RESTORE(new Request('http://localhost'), restoreCtx)).status).toBe(404);
  });

  it('returns 429 and never restores when rate-limited', async () => {
    signedIn();
    grant('editor');
    vi.mocked(rateLimit).mockResolvedValueOnce(false);
    expect((await RESTORE(new Request('http://localhost'), restoreCtx)).status).toBe(429);
    expect(restoreVersion).not.toHaveBeenCalled();
  });
});
