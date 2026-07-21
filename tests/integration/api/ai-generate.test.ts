import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/authz', () => ({
  resolveBoardAccess: vi.fn(),
  canEditRole: (role: string) => role === 'admin' || role === 'editor',
}));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn(async () => true) }));
vi.mock('ai', () => ({
  generateObject: vi.fn(async () => ({
    object: {
      nodes: [
        { id: 'n1', type: 'rectangle', text: 'Start' },
        { id: 'n2', type: 'diamond', text: 'Decision' },
      ],
      edges: [{ from: 'n1', to: 'n2' }],
      direction: 'down',
    },
  })),
}));

import { generateObject } from 'ai';

import { auth } from '@/lib/auth';
import { resolveBoardAccess } from '@/lib/authz';
import { rateLimit } from '@/lib/rate-limit';
import { POST } from '@/app/api/ai/generate/route';

const authMock = auth as unknown as ReturnType<typeof vi.fn>;
const CUID = 'ckx7p2m9q4r8s1t3u5v7w9y2z';

function req(body: unknown) {
  return new Request('http://localhost/api/ai/generate', {
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

describe('POST /api/ai/generate', () => {
  it('returns 401 when signed out', async () => {
    authMock.mockResolvedValue(null);
    expect((await POST(req({ boardId: CUID, prompt: 'x' }))).status).toBe(401);
  });

  it('returns 429 when rate limited', async () => {
    signedIn();
    vi.mocked(rateLimit).mockResolvedValue(false);
    expect((await POST(req({ boardId: CUID, prompt: 'x' }))).status).toBe(429);
  });

  it('returns 422 on an empty prompt', async () => {
    signedIn();
    expect((await POST(req({ boardId: CUID, prompt: '' }))).status).toBe(422);
  });

  it('returns 404 when the board is not owned', async () => {
    signedIn();
    vi.mocked(resolveBoardAccess).mockResolvedValue(null);
    expect((await POST(req({ boardId: CUID, prompt: 'draw a flow' }))).status).toBe(404);
    expect(generateObject).not.toHaveBeenCalled();
  });

  it('returns a positioned diagram for an owned board', async () => {
    signedIn();
    vi.mocked(resolveBoardAccess).mockResolvedValue({
      role: 'editor',
      board: {
        id: CUID,
        title: 'B',
        isPublic: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    const res = await POST(req({ boardId: CUID, prompt: 'draw a flow' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    // The route runs the model graph through dagre layout before returning.
    expect(body.data.nodes.n1.type).toBe('rectangle');
    expect(body.data.nodes.n2.type).toBe('diamond');
    expect(typeof body.data.nodes.n1.x).toBe('number');
    expect(typeof body.data.nodes.n1.y).toBe('number');
    expect(body.data.edges).toEqual([{ from: 'n1', to: 'n2' }]);
    expect(generateObject).toHaveBeenCalledOnce();
  });

  it('returns 500 when the model call fails', async () => {
    signedIn();
    vi.mocked(resolveBoardAccess).mockResolvedValue({
      role: 'editor',
      board: {
        id: CUID,
        title: 'B',
        isPublic: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    vi.mocked(generateObject).mockRejectedValueOnce(new Error('quota exceeded'));
    const res = await POST(req({ boardId: CUID, prompt: 'draw a flow' }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
