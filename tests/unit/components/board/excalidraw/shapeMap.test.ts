import { describe, expect, it } from 'vitest';

import { toExcalidrawShapeType } from '@/components/board/excalidraw/shapeMap';

describe('toExcalidrawShapeType', () => {
  it('maps native equivalents directly', () => {
    expect(toExcalidrawShapeType('rectangle')).toBe('rectangle');
    expect(toExcalidrawShapeType('ellipse')).toBe('ellipse');
    expect(toExcalidrawShapeType('diamond')).toBe('diamond');
  });

  it('maps aliases to their native shape', () => {
    expect(toExcalidrawShapeType('oval')).toBe('ellipse');
    expect(toExcalidrawShapeType('rhombus')).toBe('diamond');
  });

  it('degrades unsupported geo shapes to rectangle', () => {
    for (const geo of ['triangle', 'star', 'hexagon', 'cloud', 'heart', 'arrow-right'] as const) {
      expect(toExcalidrawShapeType(geo)).toBe('rectangle');
    }
  });
});
