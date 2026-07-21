import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/authz', () => ({
  resolveBoardAccess: vi.fn(),
  canEditRole: (role: string) => role === 'admin' || role === 'editor',
}));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn(async () => true) }));
vi.mock('@liveblocks/node', () => ({ Liveblocks: class {} }));
vi.mock('ai', () => ({
  generateObject: vi.fn(async () => ({
    object: { nodes: [{ id: 'n1', type: 'rectangle', text: 'A' }], edges: [], direction: 'down' },
  })),
}));
vi.mock('@/lib/ai-agent', () => ({ writeAgentDiagram: vi.fn(async () => 'ok') }));

import { generateObject } from 'ai';

import { writeAgentDiagram } from '@/lib/ai-agent';
import { auth } from '@/lib/auth';
import { resolveBoardAccess } from '@/lib/authz';
import { rateLimit } from '@/lib/rate-limit';
import { POST } from '@/app/api/ai/agent/route';

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
  return new Request('http://localhost/api/ai/agent', {
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
  vi.mocked(writeAgentDiagram).mockResolvedValue('ok');
  vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY', 'test-key');
  vi.stubEnv('LIVEBLOCKS_SECRET_KEY', 'sk_test');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/ai/agent', () => {
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

  it('returns 404 for a viewer and never writes to the canvas', async () => {
    signedIn();
    vi.mocked(resolveBoardAccess).mockResolvedValue({ role: 'viewer', board } as never);
    expect((await POST(req({ boardId: CUID, prompt: 'draw a flow' }))).status).toBe(404);
    expect(generateObject).not.toHaveBeenCalled();
    expect(writeAgentDiagram).not.toHaveBeenCalled();
  });

  it('writes the diagram to the live canvas for an editor', async () => {
    signedIn();
    vi.mocked(resolveBoardAccess).mockResolvedValue({ role: 'editor', board } as never);
    const res = await POST(req({ boardId: CUID, prompt: 'draw a flow' }));
    expect(res.status).toBe(200);
    expect(writeAgentDiagram).toHaveBeenCalledOnce();
  });

  it('returns 409 when the board has no canvas yet', async () => {
    signedIn();
    vi.mocked(resolveBoardAccess).mockResolvedValue({ role: 'editor', board } as never);
    vi.mocked(writeAgentDiagram).mockResolvedValue('no-canvas');
    expect((await POST(req({ boardId: CUID, prompt: 'draw a flow' }))).status).toBe(409);
  });

  it('returns 500 when the model call fails', async () => {
    signedIn();
    vi.mocked(resolveBoardAccess).mockResolvedValue({ role: 'editor', board } as never);
    vi.mocked(generateObject).mockRejectedValueOnce(new Error('quota'));
    expect((await POST(req({ boardId: CUID, prompt: 'draw a flow' }))).status).toBe(500);
  });
});
