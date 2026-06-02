import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/boards', () => ({ getBoard: vi.fn() }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn(() => true) }));
vi.mock('ai', () => ({
  generateObject: vi.fn(async () => ({
    object: { shapes: [{ type: 'rectangle', x: 0, y: 0 }] },
  })),
}));

import { generateObject } from 'ai';

import { auth } from '@/lib/auth';
import { getBoard } from '@/lib/boards';
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
  vi.mocked(rateLimit).mockReturnValue(true);
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
    vi.mocked(rateLimit).mockReturnValue(false);
    expect((await POST(req({ boardId: CUID, prompt: 'x' }))).status).toBe(429);
  });

  it('returns 422 on an empty prompt', async () => {
    signedIn();
    expect((await POST(req({ boardId: CUID, prompt: '' }))).status).toBe(422);
  });

  it('returns 404 when the board is not owned', async () => {
    signedIn();
    vi.mocked(getBoard).mockResolvedValue(null);
    expect((await POST(req({ boardId: CUID, prompt: 'draw a flow' }))).status).toBe(404);
    expect(generateObject).not.toHaveBeenCalled();
  });

  it('returns generated shapes for an owned board', async () => {
    signedIn();
    vi.mocked(getBoard).mockResolvedValue({
      id: CUID,
      title: 'B',
      isPublic: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const res = await POST(req({ boardId: CUID, prompt: 'draw a flow' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([{ type: 'rectangle', x: 0, y: 0 }]);
    expect(generateObject).toHaveBeenCalledOnce();
  });
});
