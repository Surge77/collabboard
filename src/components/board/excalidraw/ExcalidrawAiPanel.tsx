'use client';

import { useState } from 'react';
import { convertToExcalidrawElements } from '@excalidraw/excalidraw';
import type { ExcalidrawElementSkeleton } from '@excalidraw/excalidraw/data/transform';

import { useExcalidrawApi } from '@/components/board/excalidraw/ExcalidrawApiContext';
import { toExcalidrawShapeType } from '@/components/board/excalidraw/shapeMap';
import type { DiagramLayout } from '@/lib/diagram-layout';

const MAX_ANALYZE_SHAPES = 500;

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

export function ExcalidrawAiPanel({ boardId }: { boardId: string }) {
  const api = useExcalidrawApi();
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState<Busy>('idle');
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // dagre positions the nodes server-side; we render them plus arrows bound to
  // their endpoints. Binding by skeleton id requires the nodes and arrows to be
  // converted in the same batch, so both go into one array.
  function applyDiagram(layout: DiagramLayout) {
    const entries = Object.entries(layout.nodes);
    if (entries.length === 0) return;

    const nodeSkeletons: ExcalidrawElementSkeleton[] = entries.map(([id, node]) => ({
      id,
      type: toExcalidrawShapeType(node.type),
      x: node.x,
      y: node.y,
      width: node.w,
      height: node.h,
      label: node.text ? { text: node.text } : undefined,
    }));

    const validIds = new Set(entries.map(([id]) => id));
    const arrowSkeletons: ExcalidrawElementSkeleton[] = layout.edges
      .filter((e) => validIds.has(e.from) && validIds.has(e.to))
      .map((e) => ({
        type: 'arrow',
        x: 0,
        y: 0,
        label: e.text ? { text: e.text } : undefined,
        start: { id: e.from },
        end: { id: e.to },
      }));

    const created = convertToExcalidrawElements([...nodeSkeletons, ...arrowSkeletons]);
    api.updateScene({ elements: [...api.getSceneElements(), ...created] });
    api.scrollToContent(created, { fitToContent: true });
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
      const shapes = api
        .getSceneElements()
        .slice(0, MAX_ANALYZE_SHAPES)
        .map((s) => ({ type: s.type }));
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
    <div
      className={`pointer-events-auto absolute top-3 left-16 z-[300] flex flex-col gap-2 rounded-xl border border-black/10 bg-white/95 p-2 shadow-lg backdrop-blur ${open ? 'w-72 p-3' : ''}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 px-1 text-xs font-semibold text-neutral-700"
      >
        <span>✨ AI diagram</span>
        <span aria-hidden className="ml-auto text-neutral-400">
          {open ? '−' : '+'}
        </span>
      </button>
      {open ? (
        <>
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
        </>
      ) : null}
    </div>
  );
}
