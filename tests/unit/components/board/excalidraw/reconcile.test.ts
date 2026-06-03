import { describe, expect, it } from 'vitest';

import { reconcileElements } from '@/components/board/excalidraw/reconcile';

interface El {
  id: string;
  version: number;
}

const el = (id: string, version: number): El => ({ id, version });
const remote = (...pairs: [string, number][]): Map<string, number> => new Map(pairs);

describe('reconcileElements', () => {
  it('writes a new element absent from the doc', () => {
    const result = reconcileElements([el('a', 1)], remote());
    expect(result.toSet).toEqual([el('a', 1)]);
    expect(result.toDelete).toEqual([]);
  });

  it('writes a local element newer than the doc', () => {
    const result = reconcileElements([el('a', 5)], remote(['a', 3]));
    expect(result.toSet).toEqual([el('a', 5)]);
    expect(result.toDelete).toEqual([]);
  });

  it('skips a local element equal to the doc version', () => {
    const result = reconcileElements([el('a', 3)], remote(['a', 3]));
    expect(result.toSet).toEqual([]);
    expect(result.toDelete).toEqual([]);
  });

  it('skips a local element older than the doc (remote wins)', () => {
    const result = reconcileElements([el('a', 2)], remote(['a', 4]));
    expect(result.toSet).toEqual([]);
    expect(result.toDelete).toEqual([]);
  });

  it('tombstones a doc element no longer present locally', () => {
    const result = reconcileElements([], remote(['a', 1]));
    expect(result.toSet).toEqual([]);
    expect(result.toDelete).toEqual(['a']);
  });

  it('handles mixed set, skip, and delete in one pass', () => {
    const result = reconcileElements(
      [el('new', 1), el('updated', 9), el('stale', 1)],
      remote(['updated', 4], ['stale', 5], ['gone', 2])
    );
    expect(result.toSet).toEqual([el('new', 1), el('updated', 9)]);
    expect(result.toDelete).toEqual(['gone']);
  });

  it('is a no-op when local and doc match exactly', () => {
    const result = reconcileElements([el('a', 1), el('b', 2)], remote(['a', 1], ['b', 2]));
    expect(result.toSet).toEqual([]);
    expect(result.toDelete).toEqual([]);
  });

  it('does not mutate its inputs', () => {
    const local = [el('a', 1)];
    const doc = remote(['b', 1]);
    reconcileElements(local, doc);
    expect(local).toEqual([el('a', 1)]);
    expect([...doc.entries()]).toEqual([['b', 1]]);
  });
});
