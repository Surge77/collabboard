import Link from 'next/link';

import { HeroBoard } from '@/components/site/HeroBoard';
import { SiteHeader } from '@/components/site/SiteHeader';
import { buttonClass } from '@/components/ui/Button';
import { auth } from '@/lib/auth';

const FLOW = [
  {
    title: 'Describe it',
    body: 'Type a sentence in the AI panel: a signup flow, an org chart, a service map.',
  },
  {
    title: 'AI draws it for the room',
    body: 'The diagram lands on the shared board as real shapes and arrows, live for everyone.',
  },
  {
    title: 'Edit it together',
    body: 'Move, relabel and extend it with live cursors, comments and version history.',
  },
] as const;

const SESSION_TOOLS = [
  { title: 'Comments on the canvas', body: 'Pin a thread to any spot; reply and resolve.' },
  {
    title: 'Version history',
    body: 'Save before big changes. Restores ask first and keep a backup.',
  },
  { title: 'Facilitation', body: 'Shared timer, quick vote, reactions and cursor chat.' },
  { title: 'Share links', body: 'Invite people to view or edit; revoke a link any time.' },
  { title: 'Ask about the board', body: 'Summarize everything on it or pull out action items.' },
  { title: 'Export', body: 'Download the board as PNG, SVG or PDF.' },
] as const;

export default async function LandingPage() {
  const session = await auth();
  const primaryHref = session ? '/dashboard' : '/login';
  const primaryLabel = session ? 'Open your boards' : 'Start a board';

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader
        action={
          <Link href={primaryHref} className={buttonClass('secondary', 'sm')}>
            {session ? 'Dashboard' : 'Sign in'}
          </Link>
        }
      />

      <main className="flex flex-1 flex-col">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pt-14 pb-16 sm:px-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:pt-20">
          <div className="flex flex-col gap-5">
            <h1 className="text-foreground text-4xl leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
              Turn a sentence into a diagram your team edits together.
            </h1>
            <p className="text-ink-soft max-w-[52ch] text-base leading-relaxed sm:text-lg">
              CollabBoard is a real-time whiteboard with AI built in. Describe a flow or a system,
              and AI draws it as editable shapes on a board everyone sees live.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Link href={primaryHref} className={buttonClass('primary', 'md')}>
                {primaryLabel}
              </Link>
              <Link href="#how-it-works" className={buttonClass('ghost', 'md')}>
                How it works
              </Link>
            </div>
          </div>
          <HeroBoard />
        </section>

        <section id="how-it-works" className="border-line bg-surface border-y">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <h2 className="text-foreground text-2xl font-semibold tracking-[-0.02em] text-balance sm:text-3xl">
              From a sentence to a shared diagram
            </h2>
            <ol className="flex flex-col">
              {FLOW.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <div className="text-line-strong flex flex-col items-center" aria-hidden="true">
                    <span className="port mt-2" />
                    {i < FLOW.length - 1 ? <span className="bg-line-strong w-px flex-1" /> : null}
                  </div>
                  <div className="flex flex-col gap-1 pb-8">
                    <h3 className="text-foreground text-base font-semibold">{step.title}</h3>
                    <p className="text-ink-soft max-w-[60ch] text-sm leading-relaxed">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-foreground mb-8 text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
            The rest of the session, in one rail
          </h2>
          <dl className="border-line grid border-t sm:grid-cols-2 lg:grid-cols-3">
            {SESSION_TOOLS.map((tool) => (
              <div
                key={tool.title}
                className="border-line flex flex-col gap-1 border-b py-5 sm:pr-8"
              >
                <dt className="text-foreground text-sm font-semibold">{tool.title}</dt>
                <dd className="text-ink-soft text-sm leading-relaxed">{tool.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="border-line bg-surface border-t">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-4 px-4 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-foreground text-xl font-semibold tracking-[-0.01em]">
              Open a board and describe your first diagram.
            </p>
            <Link href={primaryHref} className={buttonClass('primary', 'md')}>
              {primaryLabel}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-line border-t">
        <div className="text-ink-soft mx-auto flex w-full max-w-6xl flex-wrap justify-between gap-2 px-4 py-6 text-[13px] sm:px-6">
          <span>CollabBoard</span>
          <span>Built on tldraw, Liveblocks and Gemini.</span>
        </div>
      </footer>
    </div>
  );
}
