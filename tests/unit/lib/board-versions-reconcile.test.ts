import { describe, expect, it } from 'vitest';
import { YKeyValue } from 'y-utility/y-keyvalue';
import * as Y from 'yjs';

import { computeReconcileUpdate } from '@/lib/board-versions';

// Build a Yjs doc shaped like the live canvas (a YKeyValue over 'tl_records')
// and return its full binary state, mirroring getYjsDocumentAsBinaryUpdate.
function docState(records: Record<string, unknown>): Uint8Array {
  const doc = new Y.Doc();
  const kv = new YKeyValue(doc.getArray<{ key: string; val: unknown }>('tl_records'));
  doc.transact(() => {
    for (const [key, val] of Object.entries(records)) kv.set(key, val);
  });
  return Y.encodeStateAsUpdate(doc);
}

// Apply an update to a doc seeded from `state` and read back its records —
// this is exactly what the live Liveblocks room does with sendYjsBinaryUpdate.
function applyAndRead(state: Uint8Array, update: Uint8Array): Record<string, unknown> {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, state);
  Y.applyUpdate(doc, update);
  const kv = new YKeyValue(doc.getArray<{ key: string; val: unknown }>('tl_records'));
  const out: Record<string, unknown> = {};
  for (const [key, entry] of kv.map) out[key] = entry.val;
  return out;
}

describe('computeReconcileUpdate', () => {
  it('removes records added after the version and keeps the version’s records', () => {
    const version = docState({ a: { w: 1 }, b: { w: 2 } });
    const current = docState({ a: { w: 1 }, b: { w: 2 }, c: { w: 3 } });

    const diff = computeReconcileUpdate(current, version);
    const result = applyAndRead(current, diff);

    expect(Object.keys(result).sort()).toEqual(['a', 'b']);
  });

  it('restores records deleted since the version', () => {
    const version = docState({ a: { w: 1 }, b: { w: 2 } });
    const current = docState({ a: { w: 1 } });

    const diff = computeReconcileUpdate(current, version);
    const result = applyAndRead(current, diff);

    expect(Object.keys(result).sort()).toEqual(['a', 'b']);
    expect(result.b).toEqual({ w: 2 });
  });

  it('reverts an edited record to its value in the version', () => {
    const version = docState({ a: { w: 10 } });
    const current = docState({ a: { w: 999 } });

    const diff = computeReconcileUpdate(current, version);
    const result = applyAndRead(current, diff);

    expect(result.a).toEqual({ w: 10 });
  });

  it('handles a mix of add, delete, and edit in one restore', () => {
    const version = docState({ keep: { w: 1 }, edit: { w: 2 }, gone: { w: 3 } });
    // live: keep unchanged, edit modified, gone deleted, added is new
    const current = docState({ keep: { w: 1 }, edit: { w: 200 }, added: { w: 4 } });

    const diff = computeReconcileUpdate(current, version);
    const result = applyAndRead(current, diff);

    expect(Object.keys(result).sort()).toEqual(['edit', 'gone', 'keep']);
    expect(result.edit).toEqual({ w: 2 });
    expect(result.gone).toEqual({ w: 3 });
    expect(result).not.toHaveProperty('added');
  });

  it('is idempotent — restoring an already-matching canvas is a no-op', () => {
    const version = docState({ a: { w: 1 }, b: { w: 2 } });
    const current = docState({ a: { w: 1 }, b: { w: 2 } });

    const diff = computeReconcileUpdate(current, version);
    const result = applyAndRead(current, diff);

    expect(Object.keys(result).sort()).toEqual(['a', 'b']);
  });
});
