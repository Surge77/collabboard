import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/authz', () => ({
  resolveBoardAccess: vi.fn(),
  canCommentRole: (r: string) => r === 'admin' || r === 'editor' || r === 'commenter',
  isAdminRole: (r: string) => r === 'admin',
}));
vi.mock('@/lib/comments', () => ({
  listThreads: vi.fn(),
  createComment: vi.fn(),
  setCommentResolved: vi.fn(),
  deleteComment: vi.fn(),
}));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn(async () => true) }));

import { auth } from '@/lib/auth';
import { resolveBoardAccess } from '@/lib/authz';
import { createComment, deleteComment, listThreads, setCommentResolved } from '@/lib/comments';
import { rateLimit } from '@/lib/rate-limit';
import { GET, POST } from '@/app/api/boards/[id]/comments/route';
import { DELETE, PATCH } from '@/app/api/boards/[id]/comments/[commentId]/route';

const authMock = auth as unknown as ReturnType<typeof vi.fn>;
const board = {
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
  vi.mocked(resolveBoardAccess).mockResolvedValue({ board, role: role as never });
}
const ctx = { params: Promise.resolve({ id: 'b1' }) };
const CID = 'cknz8x1230000qzrmn831i7rn';
const cCtx = { params: Promise.resolve({ id: 'b1', commentId: CID }) };
function post(body: unknown) {
  return new Request('http://localhost/api/boards/b1/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
function patch(body: unknown) {
  return new Request('http://localhost/api/boards/b1/comments/c1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET comments', () => {
  it('401 signed out', async () => {
    authMock.mockResolvedValue(null);
    expect((await GET(post({}), ctx)).status).toBe(401);
  });
  it('404 no access', async () => {
    signedIn();
    vi.mocked(resolveBoardAccess).mockResolvedValue(null);
    expect((await GET(post({}), ctx)).status).toBe(404);
  });
  it('lists for a viewer', async () => {
    signedIn();
    grant('viewer');
    vi.mocked(listThreads).mockResolvedValue([]);
    expect((await GET(post({}), ctx)).status).toBe(200);
  });
});

describe('POST comments', () => {
  it('404 for a viewer, never creates', async () => {
    signedIn();
    grant('viewer');
    expect((await POST(post({ x: 1, y: 2, body: 'hi' }), ctx)).status).toBe(404);
    expect(createComment).not.toHaveBeenCalled();
  });
  it('422 when a root comment lacks coordinates', async () => {
    signedIn();
    grant('commenter');
    expect((await POST(post({ body: 'hi' }), ctx)).status).toBe(422);
  });
  it('creates a root comment for a commenter', async () => {
    signedIn();
    grant('commenter');
    vi.mocked(createComment).mockResolvedValue({
      id: 'c1',
      body: 'hi',
      x: 1,
      y: 2,
      resolved: false,
      author: { id: 'u1', name: 'A', image: null },
      createdAt: '2026-01-01T00:00:00.000Z',
      replies: [],
    });
    const res = await POST(post({ x: 1, y: 2, body: 'hi' }), ctx);
    expect(res.status).toBe(201);
  });
  it('404 when replying to an unknown parent', async () => {
    signedIn();
    grant('commenter');
    vi.mocked(createComment).mockResolvedValue(null);
    expect(
      (await POST(post({ parentId: 'cxxxxxxxxxxxxxxxxxxxxxxxx', body: 'r' }), ctx)).status
    ).toBe(404);
  });
  it('429 when rate-limited', async () => {
    signedIn();
    grant('commenter');
    vi.mocked(rateLimit).mockResolvedValueOnce(false);
    expect((await POST(post({ x: 1, y: 2, body: 'hi' }), ctx)).status).toBe(429);
    expect(createComment).not.toHaveBeenCalled();
  });
});

describe('PATCH comment (resolve)', () => {
  it('404 for a viewer', async () => {
    signedIn();
    grant('viewer');
    expect((await PATCH(patch({ resolved: true }), cCtx)).status).toBe(404);
  });
  it('resolves for a commenter', async () => {
    signedIn();
    grant('commenter');
    vi.mocked(setCommentResolved).mockResolvedValue(true);
    expect((await PATCH(patch({ resolved: true }), cCtx)).status).toBe(200);
  });
  it('404 for a malformed comment id, never resolves', async () => {
    signedIn();
    grant('commenter');
    const badCtx = { params: Promise.resolve({ id: 'b1', commentId: 'c1' }) };
    expect((await PATCH(patch({ resolved: true }), badCtx)).status).toBe(404);
    expect(setCommentResolved).not.toHaveBeenCalled();
  });
  it('429 when rate-limited', async () => {
    signedIn();
    grant('commenter');
    vi.mocked(rateLimit).mockResolvedValueOnce(false);
    expect((await PATCH(patch({ resolved: true }), cCtx)).status).toBe(429);
    expect(setCommentResolved).not.toHaveBeenCalled();
  });
});

describe('DELETE comment', () => {
  it('passes allowAnyAuthor=true for an admin', async () => {
    signedIn();
    grant('admin');
    vi.mocked(deleteComment).mockResolvedValue(true);
    await DELETE(new Request('http://localhost'), cCtx);
    expect(deleteComment).toHaveBeenCalledWith('b1', CID, 'u1', true);
  });
  it('passes allowAnyAuthor=false for a commenter', async () => {
    signedIn();
    grant('commenter');
    vi.mocked(deleteComment).mockResolvedValue(true);
    await DELETE(new Request('http://localhost'), cCtx);
    expect(deleteComment).toHaveBeenCalledWith('b1', CID, 'u1', false);
  });
  it('404 when nothing was deleted', async () => {
    signedIn();
    grant('commenter');
    vi.mocked(deleteComment).mockResolvedValue(false);
    expect((await DELETE(new Request('http://localhost'), cCtx)).status).toBe(404);
  });
  it('404 for a malformed comment id, never deletes', async () => {
    signedIn();
    grant('commenter');
    const badCtx = { params: Promise.resolve({ id: 'b1', commentId: 'c1' }) };
    expect((await DELETE(new Request('http://localhost'), badCtx)).status).toBe(404);
    expect(deleteComment).not.toHaveBeenCalled();
  });
  it('429 when rate-limited, never deletes', async () => {
    signedIn();
    grant('commenter');
    vi.mocked(rateLimit).mockResolvedValueOnce(false);
    expect((await DELETE(new Request('http://localhost'), cCtx)).status).toBe(429);
    expect(deleteComment).not.toHaveBeenCalled();
  });
});
