'use client';

import { useState } from 'react';
import { useEditor } from 'tldraw';

import {
  applyActionItems,
  applyDiagram,
  collectShapes,
  readError,
  tidyBoard,
} from '@/components/board/ai-canvas';
import { DIAGRAM_TEMPLATES, templateLayout, type TemplateId } from '@/lib/diagram-templates';
import type { DiagramLayout } from '@/lib/diagram-layout';
import type { ActionItems } from '@/lib/validations/ai';

const MAX_ANALYZE_SHAPES = 500;

type Busy = 'idle' | 'generating' | 'analyzing' | 'actions';

export function AiPanel({ boardId }: { boardId: string }) {
  const editor = useEditor();
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState<Busy>('idle');
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // When set, Generate routes through the AI participant: the server writes the
  // diagram into the live canvas so it appears for everyone, not just this client.
  const [live, setLive] = useState(false);

  function addTemplate(id: TemplateId) {
    if (busy !== 'idle') return;
    setError(null);
    applyDiagram(editor, templateLayout(id));
  }

  function tidy() {
    if (busy !== 'idle') return;
    setError(null);
    tidyBoard(editor);
  }

  async function generate() {
    if (!prompt.trim() || busy !== 'idle') return;
    setBusy('generating');
    setError(null);
    try {
      // Live mode: the server writes the diagram into the room's canvas and it
      // syncs back to this client — so there is no diagram to apply locally.
      const endpoint = live ? '/api/ai/agent' : '/api/ai/generate';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId, prompt }),
      });
      if (!res.ok) {
        setError(await readError(res));
        return;
      }
      if (!live) {
        const { data } = (await res.json()) as { data: DiagramLayout };
        applyDiagram(editor, data);
      }
      setPrompt('');
    } catch {
      setError('Something went wrong');
    } finally {
      setBusy('idle');
    }
  }

  async function extractActions() {
    if (busy !== 'idle') return;
    setBusy('actions');
    setError(null);
    try {
      const shapes = collectShapes(editor, MAX_ANALYZE_SHAPES);
      const res = await fetch('/api/ai/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId, shapes }),
      });
      if (!res.ok) {
        setError(await readError(res));
        return;
      }
      const { data } = (await res.json()) as { data: ActionItems };
      if (data.items.length === 0) {
        setError('No action items found');
        return;
      }
      applyActionItems(editor, data.items);
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
      const shapes = collectShapes(editor, MAX_ANALYZE_SHAPES);
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

  const idle = busy === 'idle';

  return (
    <div className="pointer-events-auto absolute top-3 left-3 z-[300] flex w-72 flex-col gap-2 rounded-xl border border-black/10 bg-white/95 p-3 shadow-lg backdrop-blur">
      <label className="text-xs font-semibold text-neutral-700">AI diagram</label>

      <div className="flex flex-wrap gap-1">
        {DIAGRAM_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => addTemplate(t.id)}
            disabled={!idle}
            className="rounded-md border border-black/15 px-2 py-1 text-xs font-medium text-neutral-700 disabled:opacity-40"
          >
            {t.label}
          </button>
        ))}
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe a diagram to generate…"
        rows={3}
        className="resize-none rounded-md border border-black/15 px-2 py-1 text-sm text-neutral-900 outline-none focus:border-black/40"
      />
      <label className="flex items-center gap-2 text-xs text-neutral-600">
        <input
          type="checkbox"
          checked={live}
          onChange={(e) => setLive(e.target.checked)}
          className="accent-neutral-900"
        />
        Draw live for everyone (AI participant)
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={generate}
          disabled={!idle || !prompt.trim()}
          className="flex-1 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
        >
          {busy === 'generating' ? 'Generating…' : 'Generate'}
        </button>
        <button
          type="button"
          onClick={analyze}
          disabled={!idle}
          className="rounded-md border border-black/15 px-3 py-1.5 text-xs font-medium text-neutral-700 disabled:opacity-40"
        >
          {busy === 'analyzing' ? 'Analyzing…' : 'Analyze'}
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={extractActions}
          disabled={!idle}
          className="flex-1 rounded-md border border-black/15 px-3 py-1.5 text-xs font-medium text-neutral-700 disabled:opacity-40"
        >
          {busy === 'actions' ? 'Extracting…' : 'Action items'}
        </button>
        <button
          type="button"
          onClick={tidy}
          disabled={!idle}
          className="rounded-md border border-black/15 px-3 py-1.5 text-xs font-medium text-neutral-700 disabled:opacity-40"
        >
          Tidy up
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
