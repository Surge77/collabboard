import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: { boardSnapshot: { upsert: vi.fn() } },
}));

import type { Liveblocks } from '@liveblocks/node';

import { snapshotBoard } from '@/lib/board-snapshots';
import { db } from '@/lib/db';
import { boardRoomId } from '@/lib/liveblocks';

const upsert = db.boardSnapshot.upsert as unknown as ReturnType<typeof vi.fn>;

function mockLiveblocks(doc: ArrayBuffer | Error) {
  const getYjsDocumentAsBinaryUpdate = vi.fn(async () => {
    if (doc instanceof Error) throw doc;
    return doc;
  });
  const client = { getYjsDocumentAsBinaryUpdate } as unknown as Liveblocks;
  return { client, getYjsDocumentAsBinaryUpdate };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

describe('snapshotBoard', () => {
  it('persists the latest Yjs state for a non-empty room', async () => {
    const { client, getYjsDocumentAsBinaryUpdate } = mockLiveblocks(
      new Uint8Array([1, 2, 3]).buffer
    );
    upsert.mockResolvedValue({});

    const ok = await snapshotBoard(client, 'board1');

    expect(ok).toBe(true);
    expect(getYjsDocumentAsBinaryUpdate).toHaveBeenCalledWith(boardRoomId('board1'));
    expect(upsert).toHaveBeenCalledWith({
      where: { boardId: 'board1' },
      create: { boardId: 'board1', yjsState: expect.any(Uint8Array) },
      update: { yjsState: expect.any(Uint8Array) },
    });
  });

  it('skips persisting an empty document', async () => {
    const { client } = mockLiveblocks(new ArrayBuffer(0));
    const ok = await snapshotBoard(client, 'board1');
    expect(ok).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('returns false quietly when the room is absent', async () => {
    const { client } = mockLiveblocks(new Error('404 room not found'));
    const ok = await snapshotBoard(client, 'board1');
    expect(ok).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('warns but stays non-fatal when the board was deleted (FK failure)', async () => {
    const { client } = mockLiveblocks(new Uint8Array([1]).buffer);
    upsert.mockRejectedValue(new Error('foreign key violation'));
    const ok = await snapshotBoard(client, 'gone');
    expect(ok).toBe(false);
    expect(console.warn).toHaveBeenCalled();
  });
});
