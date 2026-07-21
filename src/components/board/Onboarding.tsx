'use client';

interface OnboardingProps {
  onCreate: () => void;
  isCreating: boolean;
}

const FEATURES = [
  { title: 'Describe it, AI draws it', body: 'Turn a sentence into a live, editable diagram.' },
  { title: 'Start from a template', body: 'Flowchart, mind map, or org chart in one click.' },
  { title: 'Work together, live', body: 'Cursors, comments, reactions, and a shared timer.' },
] as const;

// First-run dashboard state (no boards yet). Leads with the AI-first pitch so a
// new user's first action highlights the product's wedge, not an empty grid.
export function Onboarding({ onCreate, isCreating }: OnboardingProps) {
  return (
    <div className="border-foreground/30 dotgrid flex flex-col items-center gap-6 rounded-2xl border-2 border-dashed px-6 py-14 text-center">
      <div className="flex flex-col gap-2">
        <p className="font-hand text-accent -rotate-2 text-4xl">welcome to CollabBoard</p>
        <p className="text-ink-soft text-sm">
          A collaborative whiteboard where AI turns your ideas into diagrams.
        </p>
      </div>

      <ul className="grid max-w-2xl gap-4 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <li key={f.title} className="border-foreground/15 rounded-xl border bg-white/60 p-3">
            <p className="text-sm font-semibold">{f.title}</p>
            <p className="text-ink-soft mt-1 text-xs">{f.body}</p>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onCreate}
        disabled={isCreating}
        className="btn btn-accent !px-6 !py-2.5 text-sm"
      >
        {isCreating ? 'Creating…' : 'Create your first board'}
      </button>
      <p className="text-ink-soft text-xs">
        Then hit <span className="font-semibold">Generate</span> in the AI panel to try it out.
      </p>
    </div>
  );
}
