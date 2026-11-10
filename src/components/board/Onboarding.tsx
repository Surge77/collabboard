'use client';

import { Fragment } from 'react';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

interface OnboardingProps {
  onCreate: () => void;
  isCreating: boolean;
}

const STEPS = [
  { title: 'Create a board', body: 'One click, then share it with your team.' },
  { title: 'Describe a diagram', body: 'Open AI in the right rail and type a sentence.' },
  { title: 'Edit it together', body: 'Every shape is editable, live, by everyone.' },
] as const;

// First-run dashboard state (no boards yet). The three steps are drawn as nodes
// joined by connectors, the same notation the AI produces.
export function Onboarding({ onCreate, isCreating }: OnboardingProps) {
  return (
    <div className="border-line bg-surface flex flex-col items-start gap-8 rounded-lg border px-6 py-10 sm:px-10">
      <div className="flex max-w-lg flex-col gap-2">
        <h2 className="text-foreground text-xl font-semibold tracking-[-0.01em]">
          Create your first board
        </h2>
        <p className="text-ink-soft text-sm leading-relaxed">
          CollabBoard is a shared whiteboard where AI turns a sentence into a diagram your whole
          team can edit.
        </p>
      </div>

      <ol className="flex w-full flex-col gap-3 md:flex-row md:items-stretch md:gap-0">
        {STEPS.map((step, i) => (
          <Fragment key={step.title}>
            <li className="border-line-strong bg-background flex flex-1 flex-col gap-1 rounded-md border p-4">
              <span className="text-foreground text-sm font-medium">{step.title}</span>
              <span className="text-ink-soft text-[13px] leading-snug">{step.body}</span>
            </li>
            {i < STEPS.length - 1 ? (
              <li aria-hidden="true" className="text-line-strong hidden items-center md:flex">
                <span className="port" />
                <span className="bg-line-strong h-px w-6" />
                <span className="port" />
              </li>
            ) : null}
          </Fragment>
        ))}
      </ol>

      <Button variant="primary" onClick={onCreate} disabled={isCreating}>
        <Icon name="plus" size={16} />
        {isCreating ? 'Creating…' : 'Create your first board'}
      </Button>
    </div>
  );
}
