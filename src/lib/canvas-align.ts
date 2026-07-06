// Deterministic canvas tidy: snap shape positions to a grid so a roughly-placed
// diagram lines up cleanly. Pure — takes positions in, returns the ones that
// moved, so the caller can apply a single minimal update.

export const GRID_SIZE = 20;

export interface Positioned {
  id: string;
  x: number;
  y: number;
}

export interface Moved {
  id: string;
  x: number;
  y: number;
}

function snap(value: number, grid: number): number {
  return Math.round(value / grid) * grid;
}

// Returns only the shapes whose snapped position differs from their current one.
// An empty result means everything was already grid-aligned (caller can no-op).
export function snapToGrid(shapes: readonly Positioned[], grid: number = GRID_SIZE): Moved[] {
  if (grid <= 0) return [];
  const moved: Moved[] = [];
  for (const shape of shapes) {
    const x = snap(shape.x, grid);
    const y = snap(shape.y, grid);
    if (x !== shape.x || y !== shape.y) moved.push({ id: shape.id, x, y });
  }
  return moved;
}
