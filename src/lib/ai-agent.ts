import { randomUUID } from 'node:crypto';

import type { Liveblocks } from '@liveblocks/node';
import { YKeyValue } from 'y-utility/y-keyvalue';
import * as Y from 'yjs';

import { buildAgentRecords } from '@/lib/ai-agent-shapes';
import type { DiagramLayout } from '@/lib/diagram-layout';
import { boardRoomId } from '@/lib/liveblocks';

// tldraw records live in this Yjs array (see board-versions.ts / useYjsStore).
const RECORDS_ARRAY = 'tl_records';

export type AgentWriteResult = 'ok' | 'no-canvas';

function findPageId(kv: YKeyValue<unknown>): string | null {
  for (const [key, entry] of kv.map) {
    const val = entry.val as { typeName?: string } | undefined;
    if (val?.typeName === 'page') return key;
  }
  return null;
}

// Writes an AI-generated diagram straight into the board's live Yjs document so
// every connected client converges — the AI acts as a real participant, not a
// suggestion applied by one client. Mirrors board-versions' restore: seed an
// in-memory doc with the room's CURRENT state, add the new records, and send only
// the diff. Records are built tldraw-free (see ai-agent-shapes.ts) and validated
// against the real tldraw schema in a unit test.
//
// Returns 'no-canvas' when the room has no page yet (never opened) — there is
// nothing to parent shapes to, and the client lazily creates the page on first
// connect, so the caller should ask the user to open the board first.
export async function writeAgentDiagram(
  liveblocks: Liveblocks,
  boardId: string,
  layout: DiagramLayout
): Promise<AgentWriteResult> {
  const room = boardRoomId(boardId);
  // A server Yjs write 404s on a room that does not exist yet (no client has
  // lazily created it); create it before reading/writing.
  await liveblocks.getOrCreateRoom(room, { defaultAccesses: [] });

  const currentUpdate = await liveblocks.getYjsDocumentAsBinaryUpdate(room);
  const doc = new Y.Doc();
  Y.applyUpdate(doc, new Uint8Array(currentUpdate));
  const kv = new YKeyValue(doc.getArray<{ key: string; val: unknown }>(RECORDS_ARRAY));

  const pageId = findPageId(kv);
  if (!pageId) return 'no-canvas';

  const beforeSV = Y.encodeStateVector(doc);
  const records = buildAgentRecords({
    layout,
    pageId,
    newId: () => `shape:${randomUUID()}`,
  });

  doc.transact(() => {
    for (const record of records) kv.set(record.id, record);
  });

  // Diff since the seeded state == the room's state, so applying it to the live
  // room reproduces exactly the records added above.
  const diff = Y.encodeStateAsUpdate(doc, beforeSV);
  await liveblocks.sendYjsBinaryUpdate(room, diff);
  return 'ok';
}
