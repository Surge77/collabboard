import type { Liveblocks } from '@liveblocks/node';

import { db } from '@/lib/db';
import { boardRoomId } from '@/lib/liveblocks';

// Cap persisted canvas size: the webhook fires on every doc change, so an
// inflated Yjs log must not write unbounded blobs to Postgres (storage DoS).
const MAX_SNAPSHOT_BYTES = 5 * 1024 * 1024;

// Persists the latest Yjs binary state of a board's Liveblocks room to Postgres.
// Best-effort backstop: a missing room (never opened) or a board that was deleted
// between the webhook firing and this call is a normal no-op, not an error worth
// surfacing. Genuine persist failures are logged (never the canvas bytes).
export async function snapshotBoard(liveblocks: Liveblocks, boardId: string): Promise<boolean> {
  let update: ArrayBuffer;
  try {
    update = await liveblocks.getYjsDocumentAsBinaryUpdate(boardRoomId(boardId));
  } catch {
    return false;
  }
  if (update.byteLength === 0 || update.byteLength > MAX_SNAPSHOT_BYTES) return false;

  const yjsState = new Uint8Array(update);
  try {
    await db.boardSnapshot.upsert({
      where: { boardId },
      create: { boardId, yjsState },
      update: { yjsState },
    });
    return true;
  } catch (error) {
    // A foreign-key failure here means the board was deleted — nothing to back up.
    // Log only the message so canvas bytes / record dumps never reach the logs.
    const message = error instanceof Error ? error.message : String(error);
    console.warn('snapshotBoard: failed to persist snapshot —', message);
    return false;
  }
}
