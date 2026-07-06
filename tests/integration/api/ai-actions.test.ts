import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/authz', () => ({
  resolveBoardAccess: vi.fn(),
  canEditRole: (role: string) => role === 'admin' || role === 'editor',
}));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn(async () => true) }));
vi.mock('ai', () => ({
  generateObject: vi.fn(async () => ({
    object: { items: ['Draft the launch email', 'Book the venue'] },
  })),
}));

import { generateObject } from 'ai';

import { auth } from '@/lib/auth';
import { resolveBoardAccess } from '@/lib/authz';
import { rateLimit } from '@/lib/rate-limit';
import { POST } from '@/app/api/ai/actions/route';

const authMock = auth as unknown as ReturnType<typeof vi.fn>;
const CUID = 'ckx7p2m9q4r8s1t3u5v7w9y2z';
const board = {
  id: CUID,
  title: 'B',
  isPublic: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function req(body: unknown) {
  return new Request('http://localhost/api/ai/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function signedIn() {
  authMock.mockResolvedValue({ user: { id: 'u1' } });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockResolvedValue(true);
  vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY', 'test-key');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/ai/actions', () => {
  it('returns 401 when signed out', async () => {
    authMock.mockResolvedValue(null);
    expect((await POST(req({ boardId: CUID, shapes: [] }))).status).toBe(401);
  });

  it('returns 429 when rate limited', async () => {
    signedIn();
    vi.mocked(rateLimit).mockResolvedValue(false);
    expect((await POST(req({ boardId: CUID, shapes: [] }))).status).toBe(429);
  });

  it('returns 422 on malformed input', async () => {
    signedIn();
    expect((await POST(req({ boardId: CUID, shapes: 'nope' }))).status).toBe(422);
  });

  it('returns 404 for a viewer (no edit rights), never calls the model', async () => {
    signedIn();
    vi.mocked(resolveBoardAccess).mockResolvedValue({ role: 'viewer', board } as never);
    expect((await POST(req({ boardId: CUID, shapes: [] }))).status).toBe(404);
    expect(generateObject).not.toHaveBeenCalled();
  });

  it('returns action items for an editor', async () => {
    signedIn();
    vi.mocked(resolveBoardAccess).mockResolvedValue({ role: 'editor', board } as never);
    const res = await POST(
      req({ boardId: CUID, shapes: [{ type: 'note', text: 'Email launch' }] })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.items).toEqual(['Draft the launch email', 'Book the venue']);
    expect(generateObject).toHaveBeenCalledOnce();
  });

  it('returns 500 when the model call fails', async () => {
    signedIn();
    vi.mocked(resolveBoardAccess).mockResolvedValue({ role: 'editor', board } as never);
    vi.mocked(generateObject).mockRejectedValueOnce(new Error('quota'));
    const res = await POST(req({ boardId: CUID, shapes: [] }));
    expect(res.status).toBe(500);
  });
});
