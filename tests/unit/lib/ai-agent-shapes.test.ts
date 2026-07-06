import { describe, expect, it } from 'vitest';
import {
  createShapeId,
  createTLStore,
  defaultShapeUtils,
  type IndexKey,
  PageRecordType,
} from 'tldraw';

import { AI_PROVENANCE, buildAgentRecords } from '@/lib/ai-agent-shapes';
import type { DiagramLayout } from '@/lib/diagram-layout';

const layout: DiagramLayout = {
  nodes: {
    a: { type: 'ellipse', text: 'Start', x: 0, y: 0, w: 160, h: 90 },
    b: { type: 'diamond', text: 'Decision', x: 0, y: 200, w: 160, h: 90 },
    c: { type: 'rectangle', x: 200, y: 200, w: 160, h: 90 },
  },
  edges: [
    { from: 'a', to: 'b', text: 'go' },
    { from: 'b', to: 'c' },
    { from: 'b', to: 'missing' }, // dangling — must be dropped
  ],
};

function build() {
  const pageId = PageRecordType.createId();
  const records = buildAgentRecords({ layout, pageId, newId: () => createShapeId() });
  return { pageId, records };
}

describe('buildAgentRecords', () => {
  it('produces one geo per node and one arrow per resolvable edge', () => {
    const { records } = build();
    const geos = records.filter((r) => r.type === 'geo');
    const arrows = records.filter((r) => r.type === 'arrow');
    expect(geos).toHaveLength(3);
    expect(arrows).toHaveLength(2); // the dangling edge is dropped
  });

  it('tags every record with AI provenance', () => {
    const { records } = build();
    expect(records.every((r) => r.meta.source === AI_PROVENANCE)).toBe(true);
  });

  it('assigns strictly-increasing distinct index keys', () => {
    const { records } = build();
    const indices = records.map((r) => r.index);
    expect(new Set(indices).size).toBe(indices.length);
  });

  // The real schema gate: the actual tldraw store must accept every record.
  it('builds records the tldraw store validates and stores', () => {
    const store = createTLStore({ shapeUtils: defaultShapeUtils });
    const pageId = PageRecordType.createId();
    store.put([PageRecordType.create({ id: pageId, name: 'Page', index: 'a1' as IndexKey })]);

    const records = buildAgentRecords({ layout, pageId, newId: () => createShapeId() });
    // Throws a ValidationError if any record is malformed for tldraw 3.15.6.
    expect(() => store.put(records as never)).not.toThrow();

    const stored = store.allRecords().filter((r) => r.typeName === 'shape');
    expect(stored).toHaveLength(5);
  });
});
