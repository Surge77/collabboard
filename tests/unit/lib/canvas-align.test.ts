import { describe, expect, it } from 'vitest';

import { GRID_SIZE, snapToGrid } from '@/lib/canvas-align';

describe('snapToGrid', () => {
  it('snaps off-grid shapes to the nearest grid multiple', () => {
    const moved = snapToGrid([
      { id: 'a', x: 12, y: 7 },
      { id: 'b', x: 33, y: 48 },
    ]);
    expect(moved).toEqual([
      { id: 'a', x: 20, y: 0 },
      { id: 'b', x: 40, y: 40 },
    ]);
  });

  it('returns only shapes that actually moved', () => {
    const moved = snapToGrid([
      { id: 'aligned', x: GRID_SIZE * 3, y: GRID_SIZE * 2 },
      { id: 'off', x: GRID_SIZE * 3 + 4, y: 0 },
    ]);
    expect(moved.map((m) => m.id)).toEqual(['off']);
  });

  it('no-ops on an empty input or a non-positive grid', () => {
    expect(snapToGrid([])).toEqual([]);
    expect(snapToGrid([{ id: 'a', x: 7, y: 7 }], 0)).toEqual([]);
  });
});
