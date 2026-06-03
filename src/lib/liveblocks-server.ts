import type { Liveblocks } from '@liveblocks/node';

import { boardRoomId } from '@/lib/liveblocks';

// Copies the source board's canvas (its Yjs document) into the destination
// board's room. Best-effort by design: a source board that was never opened has
// no Yjs room yet, so a missing/empty document is a normal "nothing to copy"
// outcome, not a failure. Returns true only when bytes were actually copied so
// the caller can decide whether to surface a partial result.
export async function copyBoardCanvas(
  liveblocks: Liveblocks,
  sourceBoardId: string,
  targetBoardId: string
): Promise<boolean> {
  try {
    const update = await liveblocks.getYjsDocumentAsBinaryUpdate(boardRoomId(sourceBoardId));
    if (update.byteLength === 0) return false;

    await liveblocks.sendYjsBinaryUpdate(boardRoomId(targetBoardId), new Uint8Array(update));
    return true;
  } catch {
    // Source room absent (board never opened) or transient API error: the
    // metadata duplicate already succeeded, so the copy is intentionally
    // non-fatal and the new board is simply left empty.
    return false;
  }
}
