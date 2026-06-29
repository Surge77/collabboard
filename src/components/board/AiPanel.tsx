'use client';

import { useState } from 'react';
import { createShapeId, renderPlaintextFromRichText, toRichText, useEditor } from 'tldraw';
import type { Editor, TLShape, TLShapeId } from 'tldraw';

import type { DiagramLayout } from '@/lib/diagram-layout';

const MAX_ANALYZE_SHAPES = 500;
// Matches `analyzeShapeSchema.text` max length so the request never 422s.
const MAX_SHAPE_TEXT = 200;

// tldraw stores a shape's label as `props.richText`; analyze needs plain text so
// the summary AI can see what the diagram actually says, not just shape types.
function shapeText(editor: Editor, shape: TLShape): string | undefined {
  if (!('richText' in shape.props) || !shape.props.richText) return undefined;
  const text = renderPlaintextFromRichText(editor, shape.props.richText).trim();
  return text ? text.slice(0, MAX_SHAPE_TEXT) : undefined;
}

function bindTerminal(arrowId: TLShapeId, toId: TLShapeId, terminal: 'start' | 'end') {
  return {
    fromId: arrowId,
    toId,
    type: 'arrow' as const,
    props: { terminal, normalizedAnchor: { x: 0.5, y: 0.5 }, isExact: false, isPrecise: false },
  };
}

async function readError(res: Response): Promise<string> {
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

type Busy = 'idle' | 'generating' | 'analyzing';

export function AiPanel({ boardId }: { boardId: string }) {
  const editor = useEditor();
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState<Busy>('idle');
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function applyDiagram(diagram: DiagramLayout) {
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
          props: {
            geo: node.type,
            w: node.w,
            h: node.h,
            richText: toRichText(node.text ?? ''),
          },
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
        // Bound terminals override these; they are only the pre-binding geometry.
        props: {
          start: { x: from.x, y: from.y },
          end: { x: to.x, y: to.y },
          text: edge.text ?? '',
        },
      });
      editor.createBindings([
        bindTerminal(arrowId, fromId, 'start'),
        bindTerminal(arrowId, toId, 'end'),
      ]);
    }
    editor.zoomToFit();
  }

  async function generate() {
    if (!prompt.trim() || busy !== 'idle') return;
    setBusy('generating');
    setError(null);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId, prompt }),
      });
      if (!res.ok) {
        setError(await readError(res));
        return;
      }
      const { data } = (await res.json()) as { data: DiagramLayout };
      applyDiagram(data);
      setPrompt('');
    } catch {
      setError('Something went wrong');
    } finally {
      setBusy('idle');
    }
  }

  async function analyze() {
    if (busy !== 'idle') return;
    setBusy('analyzing');
    setError(null);
    setSummary('');
    try {
      const shapes = editor
        .getCurrentPageShapes()
        .slice(0, MAX_ANALYZE_SHAPES)
        .map((s) => {
          const text = shapeText(editor, s);
          return text ? { type: s.type, text } : { type: s.type };
        });
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId, shapes }),
      });
      if (!res.ok || !res.body) {
        setSummary(null);
        setError(await readError(res));
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setSummary(text);
      }
    } catch {
      setSummary(null);
      setError('Something went wrong');
    } finally {
      setBusy('idle');
    }
  }

  return (
    <div className="pointer-events-auto absolute top-3 left-3 z-[300] flex w-72 flex-col gap-2 rounded-xl border border-black/10 bg-white/95 p-3 shadow-lg backdrop-blur">
      <label className="text-xs font-semibold text-neutral-700">AI diagram</label>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe a diagram to generate…"
        rows={3}
        className="resize-none rounded-md border border-black/15 px-2 py-1 text-sm text-neutral-900 outline-none focus:border-black/40"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={generate}
          disabled={busy !== 'idle' || !prompt.trim()}
          className="flex-1 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
        >
          {busy === 'generating' ? 'Generating…' : 'Generate'}
        </button>
        <button
          type="button"
          onClick={analyze}
          disabled={busy !== 'idle'}
          className="rounded-md border border-black/15 px-3 py-1.5 text-xs font-medium text-neutral-700 disabled:opacity-40"
        >
          {busy === 'analyzing' ? 'Analyzing…' : 'Analyze'}
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
      {summary !== null && !error ? (
        <p className="max-h-32 overflow-auto text-xs whitespace-pre-wrap text-neutral-700">
          {summary || 'Analyzing…'}
        </p>
      ) : null}
    </div>
  );
}
