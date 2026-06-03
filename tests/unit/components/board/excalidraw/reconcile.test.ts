import { describe, expect, it } from 'vitest';

import { reconcileElements } from '@/components/board/excalidraw/reconcile';

interface El {
  id: string;
  version: number;
  versionNonce: number;
}

const el = (id: string, version: number, versionNonce: number): El => ({
  id,
  version,
  versionNonce,
});
const remote = (
  ...rows: [string, number, number][]
): Map<string, { version: number; versionNonce: number }> =>
  new Map(rows.map(([id, version, versionNonce]) => [id, { version, versionNonce }]));

describe('reconcileElements', () => {
  it('writes a new element absent from the doc', () => {
    const result = reconcileElements([el('a', 1, 10)], remote());
    expect(result.toSet).toEqual([el('a', 1, 10)]);
    expect(result.toDelete).toEqual([]);
  });

  it('writes a local element whose versionNonce changed at the same version', () => {
    // The drag bug: geometry mutates while version stays constant.
    const result = reconcileElements([el('a', 2, 99)], remote(['a', 2, 10]));
    expect(result.toSet).toEqual([el('a', 2, 99)]);
    expect(result.toDelete).toEqual([]);
  });

  it('writes a local element with a newer version', () => {
    const result = reconcileElements([el('a', 5, 10)], remote(['a', 3, 10]));
    expect(result.toSet).toEqual([el('a', 5, 10)]);
    expect(result.toDelete).toEqual([]);
  });

  it('skips a local element identical to the doc (same version and nonce)', () => {
    const result = reconcileElements([el('a', 3, 77)], remote(['a', 3, 77]));
    expect(result.toSet).toEqual([]);
    expect(result.toDelete).toEqual([]);
  });

  it('tombstones a doc element no longer present locally', () => {
    const result = reconcileElements([], remote(['a', 1, 10]));
    expect(result.toSet).toEqual([]);
    expect(result.toDelete).toEqual(['a']);
  });

  it('handles mixed set, skip, and delete in one pass', () => {
    const result = reconcileElements(
      [el('new', 1, 1), el('changed', 2, 99), el('same', 1, 5)],
      remote(['changed', 2, 4], ['same', 1, 5], ['gone', 2, 3])
    );
    expect(result.toSet).toEqual([el('new', 1, 1), el('changed', 2, 99)]);
    expect(result.toDelete).toEqual(['gone']);
  });

  it('is a no-op when local and doc match exactly', () => {
    const result = reconcileElements(
      [el('a', 1, 11), el('b', 2, 22)],
      remote(['a', 1, 11], ['b', 2, 22])
    );
    expect(result.toSet).toEqual([]);
    expect(result.toDelete).toEqual([]);
  });

  it('does not mutate its inputs', () => {
    const local = [el('a', 1, 1)];
    const doc = remote(['b', 1, 1]);
    reconcileElements(local, doc);
    expect(local).toEqual([el('a', 1, 1)]);
    expect([...doc.keys()]).toEqual(['b']);
  });
});
