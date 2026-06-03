import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Liveblocks } from '@liveblocks/node';
import { copyBoardCanvas } from '@/lib/liveblocks-server';
import { boardRoomId } from '@/lib/liveblocks';

function mockLiveblocks(update: ArrayBuffer | Error) {
  const getYjsDocumentAsBinaryUpdate = vi.fn(async () => {
    if (update instanceof Error) throw update;
    return update;
  });
  const sendYjsBinaryUpdate = vi.fn(async () => undefined);
  const client = { getYjsDocumentAsBinaryUpdate, sendYjsBinaryUpdate } as unknown as Liveblocks;
  return { client, getYjsDocumentAsBinaryUpdate, sendYjsBinaryUpdate };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('copyBoardCanvas', () => {
  it('copies a non-empty source document into the target room', async () => {
    const bytes = new Uint8Array([1, 2, 3]).buffer;
    const { client, getYjsDocumentAsBinaryUpdate, sendYjsBinaryUpdate } = mockLiveblocks(bytes);

    const copied = await copyBoardCanvas(client, 'src', 'dst');

    expect(copied).toBe(true);
    expect(getYjsDocumentAsBinaryUpdate).toHaveBeenCalledWith(boardRoomId('src'));
    expect(sendYjsBinaryUpdate).toHaveBeenCalledWith(boardRoomId('dst'), expect.any(Uint8Array));
  });

  it('skips the send and returns false for an empty source document', async () => {
    const { client, sendYjsBinaryUpdate } = mockLiveblocks(new ArrayBuffer(0));
    const copied = await copyBoardCanvas(client, 'src', 'dst');
    expect(copied).toBe(false);
    expect(sendYjsBinaryUpdate).not.toHaveBeenCalled();
  });

  it('returns false when the source room is absent or the API errors', async () => {
    const { client, sendYjsBinaryUpdate } = mockLiveblocks(new Error('404 room not found'));
    const copied = await copyBoardCanvas(client, 'src', 'dst');
    expect(copied).toBe(false);
    expect(sendYjsBinaryUpdate).not.toHaveBeenCalled();
  });
});
