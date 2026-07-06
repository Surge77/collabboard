import { describe, expect, it } from 'vitest';

import { DIAGRAM_TEMPLATES, templateLayout } from '@/lib/diagram-templates';

describe('diagram templates', () => {
  it('exposes flowchart, mindmap, and orgchart', () => {
    expect(DIAGRAM_TEMPLATES.map((t) => t.id)).toEqual(['flowchart', 'mindmap', 'orgchart']);
  });

  it('lays out every template into positioned nodes with resolved edges', () => {
    for (const { id } of DIAGRAM_TEMPLATES) {
      const layout = templateLayout(id);
      const nodeIds = Object.keys(layout.nodes);
      expect(nodeIds.length).toBeGreaterThan(0);
      for (const node of Object.values(layout.nodes)) {
        expect(Number.isFinite(node.x)).toBe(true);
        expect(Number.isFinite(node.y)).toBe(true);
      }
      // Every edge references nodes that exist (layoutDiagram drops dangling refs).
      for (const edge of layout.edges) {
        expect(nodeIds).toContain(edge.from);
        expect(nodeIds).toContain(edge.to);
      }
    }
  });

  it('positions flowchart nodes at distinct coordinates', () => {
    const layout = templateLayout('flowchart');
    const coords = Object.values(layout.nodes).map((n) => `${n.x},${n.y}`);
    expect(new Set(coords).size).toBe(coords.length);
  });
});
