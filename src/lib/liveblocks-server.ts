import type { Liveblocks } from '@liveblocks/node';

import { boardRoomId } from '@/lib/liveblocks';

// Reads the source board's persisted Yjs document. A board that was never opened
// has no Liveblocks room yet, so a 404 here is a normal "nothing to copy" outcome
// rather than an error worth surfacing.
async function readSourceCanvas(
  liveblocks: Liveblocks,
  sourceBoardId: string
): Promise<Uint8Array | null> {
  try {
    const update = await liveblocks.getYjsDocumentAsBinaryUpdate(boardRoomId(sourceBoardId));
    return update.byteLength === 0 ? null : new Uint8Array(update);
  } catch {
    return null;
  }
}

// Copies the source board's canvas (its Yjs document) into the destination
// board's room. Best-effort by design — a missing source room or a transient
// error leaves the new board empty rather than failing the duplicate — but
// genuine write failures are logged, never silently swallowed: the target room
// must be created before sendYjsBinaryUpdate, which 404s on a room that does not
// exist yet (a server-side duplicate has no client to lazily create it).
export async function copyBoardCanvas(
  liveblocks: Liveblocks,
  sourceBoardId: string,
  targetBoardId: string
): Promise<boolean> {
  const update = await readSourceCanvas(liveblocks, sourceBoardId);
  if (!update) return false;

  try {
    const targetRoom = boardRoomId(targetBoardId);
    await liveblocks.getOrCreateRoom(targetRoom, { defaultAccesses: [] });
    await liveblocks.sendYjsBinaryUpdate(targetRoom, update);
    return true;
  } catch (error) {
    console.warn('copyBoardCanvas: failed to write canvas to duplicated board', error);
    return false;
  }
}
