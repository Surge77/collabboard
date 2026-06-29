import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// vi.hoisted so the mock exists when the (hoisted) vi.mock factory runs.
// Classes (not arrow factories) so `new WebhookHandler()` yields a real instance
// whose `.verifyRequest` is our mock.
const { verifyRequest } = vi.hoisted(() => ({ verifyRequest: vi.fn() }));

vi.mock('@liveblocks/node', () => ({
  WebhookHandler: class {
    verifyRequest = verifyRequest;
  },
  Liveblocks: class {},
}));
vi.mock('@/lib/board-snapshots', () => ({ snapshotBoard: vi.fn(async () => true) }));

import { snapshotBoard } from '@/lib/board-snapshots';
import { boardRoomId } from '@/lib/liveblocks';
import { POST } from '@/app/api/liveblocks-webhook/route';

const CUID = 'ckx7p2m9q4r8s1t3u5v7w9y2z';
const ROOM = boardRoomId(CUID);

function req() {
  return new Request('http://localhost/api/liveblocks-webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'webhook-signature': 'sig' },
    body: '{}',
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  // clearAllMocks resets call history but not implementations — reset the verifier
  // so a thrown-signature stub from one test does not leak into the next.
  verifyRequest.mockReset();
  vi.stubEnv('LIVEBLOCKS_WEBHOOK_SECRET', 'whsec_test');
  vi.stubEnv('LIVEBLOCKS_SECRET_KEY', 'sk_test');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/liveblocks-webhook', () => {
  it('returns 204 without verifying when not configured', async () => {
    vi.stubEnv('LIVEBLOCKS_WEBHOOK_SECRET', '');
    const res = await POST(req());
    expect(res.status).toBe(204);
    expect(verifyRequest).not.toHaveBeenCalled();
  });

  it('returns 401 on an invalid signature', async () => {
    verifyRequest.mockImplementation(() => {
      throw new Error('bad signature');
    });
    const res = await POST(req());
    expect(res.status).toBe(401);
    expect(snapshotBoard).not.toHaveBeenCalled();
  });

  it('snapshots the board on a ydocUpdated event', async () => {
    verifyRequest.mockReturnValue({ type: 'ydocUpdated', data: { roomId: ROOM } });
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(snapshotBoard).toHaveBeenCalledWith(expect.anything(), CUID);
  });

  it('snapshots when the last user leaves', async () => {
    verifyRequest.mockReturnValue({ type: 'userLeft', data: { roomId: ROOM, numActiveUsers: 0 } });
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(snapshotBoard).toHaveBeenCalledWith(expect.anything(), CUID);
  });

  it('ignores userLeft while other users remain', async () => {
    verifyRequest.mockReturnValue({ type: 'userLeft', data: { roomId: ROOM, numActiveUsers: 2 } });
    const res = await POST(req());
    expect(res.status).toBe(204);
    expect(snapshotBoard).not.toHaveBeenCalled();
  });

  it('ignores unrelated events', async () => {
    verifyRequest.mockReturnValue({ type: 'storageUpdated', data: { roomId: ROOM } });
    const res = await POST(req());
    expect(res.status).toBe(204);
    expect(snapshotBoard).not.toHaveBeenCalled();
  });

  it('ignores events for a room id that is not a board room', async () => {
    verifyRequest.mockReturnValue({
      type: 'ydocUpdated',
      data: { roomId: 'collabboard:board:not-a-cuid' },
    });
    const res = await POST(req());
    expect(res.status).toBe(204);
    expect(snapshotBoard).not.toHaveBeenCalled();
  });
});
