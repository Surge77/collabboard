import { createShapeId, renderPlaintextFromRichText, toRichText } from 'tldraw';
import type { Editor, TLShape, TLShapeId } from 'tldraw';

import { snapToGrid, type Positioned } from '@/lib/canvas-align';
import type { DiagramLayout } from '@/lib/diagram-layout';

const MAX_SHAPE_TEXT = 200;
const NOTE_SIZE = 200;
const NOTE_GAP = 20;

// tldraw stores a shape's label as `props.richText`; the AI features need plain
// text so the model sees what the diagram says, not just shape types.
export function shapeText(editor: Editor, shape: TLShape): string | undefined {
  if (!('richText' in shape.props) || !shape.props.richText) return undefined;
  const text = renderPlaintextFromRichText(editor, shape.props.richText).trim();
  return text ? text.slice(0, MAX_SHAPE_TEXT) : undefined;
}

export interface AnalyzeShapePayload {
  type: string;
  text?: string;
}

export function collectShapes(editor: Editor, limit: number): AnalyzeShapePayload[] {
  return editor
    .getCurrentPageShapes()
    .slice(0, limit)
    .map((s) => {
      const text = shapeText(editor, s);
      return text ? { type: s.type, text } : { type: s.type };
    });
}

function bindTerminal(arrowId: TLShapeId, toId: TLShapeId, terminal: 'start' | 'end') {
  return {
    fromId: arrowId,
    toId,
    type: 'arrow' as const,
    props: { terminal, normalizedAnchor: { x: 0.5, y: 0.5 }, isExact: false, isPrecise: false },
  };
}

export function applyDiagram(editor: Editor, diagram: DiagramLayout): void {
  const entries = Object.entries(diagram.nodes);
  if (entries.length === 0) return;

  const idMap = new Map<string, TLShapeId>();
  const center = new Map<string, { x: number; y: number }>();

  editor.createShapes(
    entries.map(([key, node]) => {
      const id = createShapeId();
      idMap.set(key, id);
      center.set(key, { x: node.x + node.w / 2, y: node.y + node.h / 2 });
      return {
        id,
        type: 'geo' as const,
        x: node.x,
        y: node.y,
        props: { geo: node.type, w: node.w, h: node.h, richText: toRichText(node.text ?? '') },
      };
    })
  );

  for (const edge of diagram.edges) {
    const fromId = idMap.get(edge.from);
    const toId = idMap.get(edge.to);
    const from = center.get(edge.from);
    const to = center.get(edge.to);
    if (!fromId || !toId || !from || !to) continue;
    const arrowId = createShapeId();
    editor.createShape({
      id: arrowId,
      type: 'arrow',
      props: { start: { x: from.x, y: from.y }, end: { x: to.x, y: to.y }, text: edge.text ?? '' },
    });
    editor.createBindings([
      bindTerminal(arrowId, fromId, 'start'),
      bindTerminal(arrowId, toId, 'end'),
    ]);
  }
  editor.zoomToFit();
}

// Stamps extracted action items as a vertical stack of sticky notes near the top
// of the current viewport, then frames them in view.
export function applyActionItems(editor: Editor, items: readonly string[]): void {
  if (items.length === 0) return;
  const origin = editor.getViewportPageBounds();
  const baseX = Math.round(origin.x + 60);
  const baseY = Math.round(origin.y + 60);

  editor.createShapes(
    items.map((text, i) => ({
      id: createShapeId(),
      type: 'note' as const,
      x: baseX,
      y: baseY + i * (NOTE_SIZE + NOTE_GAP),
      props: { richText: toRichText(text) },
    }))
  );
  editor.zoomToFit();
}

// Snaps every shape on the page to the grid. No-ops when nothing moved.
export function tidyBoard(editor: Editor): number {
  const shapes: Positioned[] = editor
    .getCurrentPageShapes()
    .map((s) => ({ id: s.id, x: s.x, y: s.y }));
  const moved = snapToGrid(shapes);
  if (moved.length === 0) return 0;
  editor.updateShapes(
    moved.map((m) => {
      const shape = editor.getShape(m.id as TLShapeId);
      return { id: m.id as TLShapeId, type: shape?.type ?? 'geo', x: m.x, y: m.y };
    })
  );
  return moved.length;
}

export async function readError(res: Response): Promise<string> {
  const body: unknown = await res.json().catch(() => null);
  if (
    body &&
    typeof body === 'object' &&
    'error' in body &&
    body.error &&
    typeof body.error === 'object' &&
    'message' in body.error &&
    typeof body.error.message === 'string'
  ) {
    return body.error.message;
  }
  return 'Something went wrong';
}
