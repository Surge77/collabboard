import { describe, expect, it } from 'vitest';

import { layoutDiagram } from '@/lib/diagram-layout';
import type { AiGraph } from '@/lib/validations/ai';

function graph(overrides: Partial<AiGraph> = {}): AiGraph {
  return {
    nodes: [
      { id: 'a', type: 'rectangle', text: 'Start' },
      { id: 'b', type: 'diamond', text: 'Choose' },
    ],
    edges: [{ from: 'a', to: 'b' }],
    ...overrides,
  };
}

describe('layoutDiagram', () => {
  it('positions every node with size and preserves type and text', () => {
    const { nodes } = layoutDiagram(graph());
    expect(Object.keys(nodes)).toEqual(['a', 'b']);
    expect(nodes.a.type).toBe('rectangle');
    expect(nodes.a.text).toBe('Start');
    expect(nodes.b.type).toBe('diamond');
    for (const node of Object.values(nodes)) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
      expect(node.w).toBeGreaterThan(0);
      expect(node.h).toBeGreaterThan(0);
    }
  });

  it('keeps edges that reference existing nodes', () => {
    const { edges } = layoutDiagram(graph());
    expect(edges).toEqual([{ from: 'a', to: 'b' }]);
  });

  it('drops edges that reference unknown nodes', () => {
    const { edges } = layoutDiagram(
      graph({
        edges: [
          { from: 'a', to: 'b' },
          { from: 'a', to: 'ghost' },
          { from: 'x', to: 'b' },
        ],
      })
    );
    expect(edges).toEqual([{ from: 'a', to: 'b' }]);
  });

  it('stacks connected nodes vertically when direction is down', () => {
    const { nodes } = layoutDiagram(graph({ direction: 'down' }));
    expect(nodes.b.y).toBeGreaterThan(nodes.a.y);
  });

  it('lays connected nodes left-to-right when direction is right', () => {
    const { nodes } = layoutDiagram(graph({ direction: 'right' }));
    expect(nodes.b.x).toBeGreaterThan(nodes.a.x);
  });

  it('handles a single node with no edges', () => {
    const { nodes, edges } = layoutDiagram({
      nodes: [{ id: 'solo', type: 'ellipse' }],
      edges: [],
    });
    expect(Object.keys(nodes)).toEqual(['solo']);
    expect(edges).toEqual([]);
  });
});
