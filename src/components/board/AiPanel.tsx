'use client';

import { useId, useState } from 'react';
import { useEditor } from 'tldraw';

import {
  applyActionItems,
  applyDiagram,
  collectShapes,
  tidyBoard,
} from '@/components/board/ai-canvas';
import { Button } from '@/components/ui/Button';
import { LABEL_CLASS, TEXTAREA_CLASS } from '@/components/ui/field';
import { DIAGRAM_TEMPLATES, templateLayout, type TemplateId } from '@/lib/diagram-templates';
import type { DiagramLayout } from '@/lib/diagram-layout';
import { readError } from '@/lib/read-error';
import type { ActionItems } from '@/lib/validations/ai';

const MAX_ANALYZE_SHAPES = 500;
const NETWORK_ERROR = 'Could not reach the AI service. Check your connection and try again.';

type Busy = 'idle' | 'generating' | 'analyzing' | 'actions';

const BOARD_ACTIONS: { id: 'analyze' | 'actions' | 'tidy'; label: string; hint: string }[] = [
  {
    id: 'analyze',
    label: 'Summarize board',
    hint: 'Reads every shape and writes a short summary.',
  },
  { id: 'actions', label: 'Extract action items', hint: 'Finds to-dos and adds them as stickies.' },
  { id: 'tidy', label: 'Tidy up', hint: 'Snaps every shape to the grid.' },
];

// Panel body for the AI tab. Generate is the primary action; the board actions
// below it each say what they do, so nothing needs to be guessed.
export function AiPanel({ boardId }: { boardId: string }) {
  const editor = useEditor();
  const promptId = useId();
  const liveId = useId();
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState<Busy>('idle');
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // When set, Generate routes through the AI participant: the server writes the
  // diagram into the live canvas so it appears for everyone, not just this client.
  const [live, setLive] = useState(false);
  const idle = busy === 'idle';

  function addTemplate(id: TemplateId) {
    if (!idle) return;
    setError(null);
    applyDiagram(editor, templateLayout(id));
  }

  async function generate() {
    if (!prompt.trim() || !idle) return;
    setBusy('generating');
    setError(null);
    try {
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
      // Live mode: the server writes into the room and it syncs back here.
      if (!live) {
        const { data } = (await res.json()) as { data: DiagramLayout };
        applyDiagram(editor, data);
      }
      setPrompt('');
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setBusy('idle');
    }
  }

  async function extractActions() {
    setBusy('actions');
    setError(null);
    try {
      const res = await fetch('/api/ai/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId, shapes: collectShapes(editor, MAX_ANALYZE_SHAPES) }),
      });
      if (!res.ok) {
        setError(await readError(res));
        return;
      }
      const { data } = (await res.json()) as { data: ActionItems };
      if (data.items.length === 0) {
        setError('No action items found on this board.');
        return;
      }
      applyActionItems(editor, data.items);
    } catch {
      setError(NETWORK_ERROR);
    } finally {
      setBusy('idle');
    }
  }

  async function analyze() {
    setBusy('analyzing');
    setError(null);
    setSummary('');
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId, shapes: collectShapes(editor, MAX_ANALYZE_SHAPES) }),
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
      setError(NETWORK_ERROR);
    } finally {
      setBusy('idle');
    }
  }

  function runBoardAction(id: (typeof BOARD_ACTIONS)[number]['id']) {
    if (!idle) return;
    if (id === 'analyze') void analyze();
    else if (id === 'actions') void extractActions();
    else {
      setError(null);
      tidyBoard(editor);
    }
  }

  return (
    <>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void generate();
        }}
      >
        <label htmlFor={promptId} className={LABEL_CLASS}>
          Describe a diagram
        </label>
        <textarea
          id={promptId}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void generate();
          }}
          placeholder="e.g. Signup flow: landing, form, email check, dashboard"
          rows={3}
          className={TEXTAREA_CLASS}
        />
        <div className="flex items-start gap-2">
          <input
            id={liveId}
            type="checkbox"
            checked={live}
            onChange={(e) => setLive(e.target.checked)}
            className="accent-accent mt-0.5 h-4 w-4 shrink-0"
            aria-describedby={`${liveId}-hint`}
          />
          <label htmlFor={liveId} className="text-[13px] leading-snug">
            <span className="text-foreground font-medium">Draw live for everyone</span>
            <span id={`${liveId}-hint`} className="text-ink-soft block">
              The AI draws straight onto the shared board, so everyone sees it appear.
            </span>
          </label>
        </div>
        <Button type="submit" variant="primary" disabled={!idle || !prompt.trim()}>
          {busy === 'generating' ? 'Generating…' : 'Generate diagram'}
        </Button>
      </form>

      <section aria-labelledby="ai-templates" className="flex flex-col gap-2">
        <h3 id="ai-templates" className={LABEL_CLASS}>
          Or start from a template
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {DIAGRAM_TEMPLATES.map((t) => (
            <Button key={t.id} size="sm" onClick={() => addTemplate(t.id)} disabled={!idle}>
              {t.label}
            </Button>
          ))}
        </div>
      </section>

      <section aria-labelledby="ai-board" className="border-line flex flex-col gap-1 border-t pt-4">
        <h3 id="ai-board" className={`${LABEL_CLASS} mb-1`}>
          Work with this board
        </h3>
        {BOARD_ACTIONS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => runBoardAction(a.id)}
            disabled={!idle}
            className="hover:bg-hover -mx-2 flex flex-col items-start rounded-md px-2 py-1.5 text-left transition-colors duration-150 disabled:opacity-45"
          >
            <span className="text-foreground text-[13px] font-medium">
              {busy === 'analyzing' && a.id === 'analyze'
                ? 'Summarizing…'
                : busy === 'actions' && a.id === 'actions'
                  ? 'Extracting…'
                  : a.label}
            </span>
            <span className="text-ink-soft text-xs">{a.hint}</span>
          </button>
        ))}
      </section>

      {error ? (
        <p role="alert" className="text-danger text-[13px]">
          {error}
        </p>
      ) : null}
      {summary !== null && !error ? (
        <div role="status" className="bg-hover rounded-md p-3">
          <p className="text-foreground text-[13px] leading-relaxed whitespace-pre-wrap">
            {summary || 'Summarizing…'}
          </p>
        </div>
      ) : null}
    </>
  );
}
