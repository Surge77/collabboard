import { describe, expect, it } from 'vitest';

import { elementsToSync } from '@/components/board/excalidraw/reconcile';

interface El {
  id: string;
  version: number;
  versionNonce: number;
  width: number;
  height: number;
  isDeleted: boolean;
}

function el(id: string, version: number, versionNonce: number, over: Partial<El> = {}): El {
  return { id, version, versionNonce, width: 100, height: 80, isDeleted: false, ...over };
}

const remote = (
  ...rows: [string, number, number][]
): Map<string, { version: number; versionNonce: number }> =>
  new Map(rows.map(([id, version, versionNonce]) => [id, { version, versionNonce }]));

describe('elementsToSync', () => {
  it('includes an element absent from the doc', () => {
    expect(elementsToSync([el('a', 1, 10)], remote())).toEqual([el('a', 1, 10)]);
  });

  it('includes an element whose versionNonce changed at the same version (drag)', () => {
    expect(elementsToSync([el('a', 2, 99)], remote(['a', 2, 10]))).toEqual([el('a', 2, 99)]);
  });

  it('includes an element with a newer version', () => {
    expect(elementsToSync([el('a', 5, 10)], remote(['a', 3, 10]))).toEqual([el('a', 5, 10)]);
  });

  it('excludes an element identical to the doc', () => {
    expect(elementsToSync([el('a', 3, 77)], remote(['a', 3, 77]))).toEqual([]);
  });

  it('excludes a zero-size in-progress draft', () => {
    const draft = el('a', 1, 10, { width: 0, height: 0 });
    expect(elementsToSync([draft], remote())).toEqual([]);
  });

  it('includes a deleted element even when zero-size (so deletion propagates)', () => {
    const removed = el('a', 4, 12, { width: 0, height: 0, isDeleted: true });
    expect(elementsToSync([removed], remote(['a', 3, 11]))).toEqual([removed]);
  });

  it('never removes doc entries that are absent locally', () => {
    // A transient local set missing an element must not signal a delete.
    const result = elementsToSync([el('a', 1, 1)], remote(['a', 1, 1], ['b', 1, 1]));
    expect(result).toEqual([]);
  });

  it('does not mutate its inputs', () => {
    const local = [el('a', 1, 1)];
    const doc = remote(['b', 1, 1]);
    elementsToSync(local, doc);
    expect(local).toEqual([el('a', 1, 1)]);
    expect([...doc.keys()]).toEqual(['b']);
  });
});
