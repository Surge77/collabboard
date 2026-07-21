import type { Liveblocks } from '@liveblocks/node';
import { YKeyValue } from 'y-utility/y-keyvalue';
import * as Y from 'yjs';

import { db } from '@/lib/db';
import { boardRoomId } from '@/lib/liveblocks';

// Same cap as the snapshot backstop: never persist an unbounded canvas blob.
const MAX_VERSION_BYTES = 5 * 1024 * 1024;
// Keep the most recent N versions per board so history cannot grow without bound.
const MAX_VERSIONS_PER_BOARD = 50;
const MAX_LABEL_LENGTH = 80;
// tldraw records live in this Yjs array (see useYjsStore / yjsDocumentSync).
const RECORDS_ARRAY = 'tl_records';

export interface BoardVersionSummary {
  id: string;
  label: string | null;
  createdById: string | null;
  createdAt: string;
}

function toSummary(v: {
  id: string;
  label: string | null;
  createdById: string | null;
  createdAt: Date;
}): BoardVersionSummary {
  return {
    id: v.id,
    label: v.label,
    createdById: v.createdById,
    createdAt: v.createdAt.toISOString(),
  };
}

export async function listVersions(boardId: string): Promise<BoardVersionSummary[]> {
  const versions = await db.boardVersion.findMany({
    where: { boardId },
    orderBy: { createdAt: 'desc' },
    // yjsState is intentionally excluded — the list never ships canvas bytes.
    select: { id: true, label: true, createdById: true, createdAt: true },
  });
  return versions.map(toSummary);
}

// Captures the board's current canvas as a new named version. Returns null when
// the room has never been opened (no Yjs state to snapshot) or the state is
// empty/oversized.
export async function saveVersion(
  liveblocks: Liveblocks,
  boardId: string,
  userId: string,
  label?: string
): Promise<BoardVersionSummary | null> {
  let update: ArrayBuffer;
  try {
    update = await liveblocks.getYjsDocumentAsBinaryUpdate(boardRoomId(boardId));
  } catch {
    return null;
  }
  if (update.byteLength === 0 || update.byteLength > MAX_VERSION_BYTES) return null;

  const version = await db.boardVersion.create({
    data: {
      boardId,
      yjsState: new Uint8Array(update),
      label: label?.slice(0, MAX_LABEL_LENGTH) || null,
      createdById: userId,
    },
    select: { id: true, label: true, createdById: true, createdAt: true },
  });

  // Prune the oldest beyond the retention cap (best-effort; never blocks the save).
  const stale = await db.boardVersion.findMany({
    where: { boardId },
    orderBy: { createdAt: 'desc' },
    skip: MAX_VERSIONS_PER_BOARD,
    select: { id: true },
  });
  if (stale.length) {
    await db.boardVersion.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
  }

  return toSummary(version);
}

function recordKeys(state: Uint8Array): { doc: Y.Doc; kv: YKeyValue<unknown> } {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, state);
  const arr = doc.getArray<{ key: string; val: unknown }>(RECORDS_ARRAY);
  return { doc, kv: new YKeyValue(arr) };
}

// Pure CRDT reconcile: given the room's current Yjs state and a target version's
// state, produce the binary update that, applied to the current doc, transforms
// its tldraw records to exactly match the target (deleting records the target
// lacks, setting the ones it has). Isolated from Liveblocks so it can be tested
// with real Yjs docs — the merge semantics are the whole risk of restore.
export function computeReconcileUpdate(
  currentState: Uint8Array,
  targetState: Uint8Array
): Uint8Array {
  const { doc: liveDoc, kv: liveKv } = recordKeys(currentState);
  const { kv: versionKv } = recordKeys(targetState);

  const beforeSV = Y.encodeStateVector(liveDoc);
  const target = versionKv.yarray.toJSON() as { key: string; val: unknown }[];
  const targetKeys = new Set(target.map((e) => e.key));

  liveDoc.transact(() => {
    for (const key of [...liveKv.map.keys()]) {
      if (!targetKeys.has(key)) liveKv.delete(key);
    }
    for (const { key, val } of target) {
      liveKv.set(key, val);
    }
  });

  // Diff since the seeded state == the room's state, so this update applied to
  // the live room reproduces exactly the deletes + sets computed above.
  return Y.encodeStateAsUpdate(liveDoc, beforeSV);
}

// Restores the board's live canvas to a saved version. Because a Yjs doc is a
// CRDT, we cannot simply re-apply the old state (that would merge, never remove
// newer shapes). Instead we seed an in-memory doc with the room's CURRENT state,
// transactionally transform it to equal the target version (delete records the
// version lacks, set the records it has), and send only that diff to the room so
// every connected client converges. Returns false when the version is unknown.
export async function restoreVersion(
  liveblocks: Liveblocks,
  boardId: string,
  versionId: string
): Promise<boolean> {
  const version = await db.boardVersion.findFirst({
    where: { id: versionId, boardId },
    select: { yjsState: true },
  });
  if (!version) return false;

  const room = boardRoomId(boardId);
  // A version may be restored into a room that has been evicted since; the copy
  // path (board duplicate) hit exactly this — a server Yjs write 404s on a room
  // that does not exist yet. Create it before writing.
  await liveblocks.getOrCreateRoom(room, { defaultAccesses: [] });

  const currentUpdate = await liveblocks.getYjsDocumentAsBinaryUpdate(room);
  const diff = computeReconcileUpdate(
    new Uint8Array(currentUpdate),
    new Uint8Array(version.yjsState)
  );
  await liveblocks.sendYjsBinaryUpdate(room, diff);
  return true;
}
