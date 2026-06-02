import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/boards', () => ({
  listBoards: vi.fn(),
  createBoard: vi.fn(),
  getBoard: vi.fn(),
  updateBoard: vi.fn(),
  deleteBoard: vi.fn(),
}));

import { auth } from '@/lib/auth';
import * as boards from '@/lib/boards';
import { GET, POST } from '@/app/api/boards/route';
import { DELETE, GET as GET_ONE, PATCH } from '@/app/api/boards/[id]/route';

const authMock = auth as unknown as ReturnType<typeof vi.fn>;
const summary = {
  id: 'b1',
  title: 'My board',
  isPublic: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function signedIn() {
  authMock.mockResolvedValue({ user: { id: 'u1' } });
}

function jsonRequest(body: unknown) {
  return new Request('http://localhost/api/boards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/boards', () => {
  it('returns 401 when signed out', async () => {
    authMock.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns the user boards when signed in', async () => {
    signedIn();
    vi.mocked(boards.listBoards).mockResolvedValue([summary]);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([summary]);
  });
});

describe('POST /api/boards', () => {
  it('creates a board and returns 201', async () => {
    signedIn();
    vi.mocked(boards.createBoard).mockResolvedValue(summary);
    const res = await POST(jsonRequest({ title: 'My board' }));
    expect(res.status).toBe(201);
    expect(boards.createBoard).toHaveBeenCalledWith('u1', { title: 'My board' });
  });

  it('rejects an over-long title with 422', async () => {
    signedIn();
    const res = await POST(jsonRequest({ title: 'x'.repeat(81) }));
    expect(res.status).toBe(422);
    expect(boards.createBoard).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/boards/[id]', () => {
  it('returns 404 when the board is not owned', async () => {
    signedIn();
    vi.mocked(boards.updateBoard).mockResolvedValue(null);
    const req = jsonRequest({ title: 'Renamed' });
    const res = await PATCH(req, params('b1'));
    expect(res.status).toBe(404);
  });

  it('returns 422 on an empty body', async () => {
    signedIn();
    const res = await PATCH(jsonRequest({}), params('b1'));
    expect(res.status).toBe(422);
  });
});

describe('DELETE /api/boards/[id]', () => {
  it('returns 200 when a board is deleted', async () => {
    signedIn();
    vi.mocked(boards.deleteBoard).mockResolvedValue(true);
    const res = await DELETE(new Request('http://localhost'), params('b1'));
    expect(res.status).toBe(200);
  });

  it('returns 404 when nothing was deleted', async () => {
    signedIn();
    vi.mocked(boards.deleteBoard).mockResolvedValue(false);
    const res = await DELETE(new Request('http://localhost'), params('b1'));
    expect(res.status).toBe(404);
  });
});

describe('GET /api/boards/[id]', () => {
  it('returns 401 when signed out', async () => {
    authMock.mockResolvedValue(null);
    const res = await GET_ONE(new Request('http://localhost'), params('b1'));
    expect(res.status).toBe(401);
  });
});
