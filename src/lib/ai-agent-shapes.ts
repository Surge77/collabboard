import type { DiagramLayout } from '@/lib/diagram-layout';

// Builds tldraw records for AI-authored diagrams WITHOUT importing tldraw, so the
// server route stays free of tldraw's DOM-coupled bundle. The record shapes are
// hardcoded to tldraw 3.15.6's schema and validated against the real tldraw
// store in a jsdom unit test (ai-agent-shapes.test.ts) — that test is the schema
// gate. Records carry `meta.source = 'ai'` for provenance.

export const AI_PROVENANCE = 'ai';

// Discovered from GeoShapeUtil/ArrowShapeUtil getDefaultProps() (tldraw 3.15.6).
const GEO_DEFAULT_PROPS = {
  dash: 'draw',
  growY: 0,
  url: '',
  scale: 1,
  color: 'black',
  labelColor: 'black',
  fill: 'none',
  size: 'm',
  font: 'draw',
  align: 'middle',
  verticalAlign: 'middle',
} as const;

const ARROW_DEFAULT_PROPS = {
  kind: 'arc',
  elbowMidPoint: 0.5,
  dash: 'draw',
  size: 'm',
  fill: 'none',
  color: 'black',
  labelColor: 'black',
  bend: 0,
  arrowheadStart: 'none',
  arrowheadEnd: 'arrow',
  labelPosition: 0.5,
  font: 'draw',
  scale: 1,
} as const;

export interface TlRecordLike {
  id: string;
  typeName: 'shape';
  type: 'geo' | 'arrow';
  x: number;
  y: number;
  rotation: number;
  index: string;
  parentId: string;
  isLocked: boolean;
  opacity: number;
  meta: { source: string };
  props: Record<string, unknown>;
}

// tldraw stores a shape label as a ProseMirror-style rich-text doc. Probed from
// toRichText(): plain text → one paragraph with a text node; empty → bare paragraph.
function richText(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) return { type: 'doc', content: [{ type: 'paragraph' }] };
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: trimmed }] }],
  };
}

// Fractional index keys are strictly increasing base-62 strings; 'a1'..'a9' then
// 'aA'.. keep ordering for the small (<= 24 node + 32 edge) diagrams we build.
const INDEX_ALPHABET = '123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
function indexKey(n: number): string {
  return `a${INDEX_ALPHABET[n % INDEX_ALPHABET.length]}`;
}

interface BuildArgs {
  layout: DiagramLayout;
  pageId: string;
  newId: () => string; // returns a `shape:<id>` tldraw id
}

// Converts a positioned diagram into geo (node) + arrow (edge) records, ready to
// set into the room's Yjs `tl_records`. Arrows use fixed start/end points (no
// bindings) so no binding records are needed.
export function buildAgentRecords({ layout, pageId, newId }: BuildArgs): TlRecordLike[] {
  const records: TlRecordLike[] = [];
  const center = new Map<string, { id: string; x: number; y: number }>();
  let cursor = 0;

  for (const [key, node] of Object.entries(layout.nodes)) {
    const id = newId();
    center.set(key, { id, x: node.x + node.w / 2, y: node.y + node.h / 2 });
    records.push({
      id,
      typeName: 'shape',
      type: 'geo',
      x: node.x,
      y: node.y,
      rotation: 0,
      index: indexKey(cursor++),
      parentId: pageId,
      isLocked: false,
      opacity: 1,
      meta: { source: AI_PROVENANCE },
      props: {
        ...GEO_DEFAULT_PROPS,
        geo: node.type,
        w: node.w,
        h: node.h,
        richText: richText(node.text ?? ''),
      },
    });
  }

  for (const edge of layout.edges) {
    const from = center.get(edge.from);
    const to = center.get(edge.to);
    if (!from || !to) continue;
    records.push({
      id: newId(),
      typeName: 'shape',
      type: 'arrow',
      x: 0,
      y: 0,
      rotation: 0,
      index: indexKey(cursor++),
      parentId: pageId,
      isLocked: false,
      opacity: 1,
      meta: { source: AI_PROVENANCE },
      props: {
        ...ARROW_DEFAULT_PROPS,
        start: { x: from.x, y: from.y },
        end: { x: to.x, y: to.y },
        text: edge.text ?? '',
      },
    });
  }

  return records;
}
