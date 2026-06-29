import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Liveblocks } from '@liveblocks/node';
import { copyBoardCanvas } from '@/lib/liveblocks-server';
import { boardRoomId } from '@/lib/liveblocks';

interface Overrides {
  source?: ArrayBuffer | Error;
  send?: Error;
  getOrCreate?: Error;
}

function mockLiveblocks({ source = new ArrayBuffer(0), send, getOrCreate }: Overrides) {
  const getYjsDocumentAsBinaryUpdate = vi.fn(async () => {
    if (source instanceof Error) throw source;
    return source;
  });
  const getOrCreateRoom = vi.fn(async () => {
    if (getOrCreate) throw getOrCreate;
    return {};
  });
  const sendYjsBinaryUpdate = vi.fn(async () => {
    if (send) throw send;
  });
  const client = {
    getYjsDocumentAsBinaryUpdate,
    getOrCreateRoom,
    sendYjsBinaryUpdate,
  } as unknown as Liveblocks;
  return { client, getYjsDocumentAsBinaryUpdate, getOrCreateRoom, sendYjsBinaryUpdate };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

describe('copyBoardCanvas', () => {
  it('creates the target room before sending a non-empty source document', async () => {
    const bytes = new Uint8Array([1, 2, 3]).buffer;
    const { client, getOrCreateRoom, sendYjsBinaryUpdate } = mockLiveblocks({ source: bytes });

    const copied = await copyBoardCanvas(client, 'src', 'dst');

    expect(copied).toBe(true);
    // The room must exist before the Yjs write, which 404s otherwise.
    expect(getOrCreateRoom).toHaveBeenCalledWith(boardRoomId('dst'), { defaultAccesses: [] });
    expect(getOrCreateRoom.mock.invocationCallOrder[0]).toBeLessThan(
      sendYjsBinaryUpdate.mock.invocationCallOrder[0]
    );
    expect(sendYjsBinaryUpdate).toHaveBeenCalledWith(boardRoomId('dst'), expect.any(Uint8Array));
  });

  it('skips create and send and returns false for an empty source document', async () => {
    const { client, getOrCreateRoom, sendYjsBinaryUpdate } = mockLiveblocks({
      source: new ArrayBuffer(0),
    });
    const copied = await copyBoardCanvas(client, 'src', 'dst');
    expect(copied).toBe(false);
    expect(getOrCreateRoom).not.toHaveBeenCalled();
    expect(sendYjsBinaryUpdate).not.toHaveBeenCalled();
  });

  it('returns false quietly when the source room is absent', async () => {
    const { client, getOrCreateRoom } = mockLiveblocks({ source: new Error('404 room not found') });
    const copied = await copyBoardCanvas(client, 'src', 'dst');
    expect(copied).toBe(false);
    expect(getOrCreateRoom).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('warns but stays non-fatal when the write to the target fails', async () => {
    const bytes = new Uint8Array([1, 2, 3]).buffer;
    const { client } = mockLiveblocks({ source: bytes, send: new Error('boom') });
    const copied = await copyBoardCanvas(client, 'src', 'dst');
    expect(copied).toBe(false);
    expect(console.warn).toHaveBeenCalled();
  });
});
