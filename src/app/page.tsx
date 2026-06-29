import Link from 'next/link';

import { CursorTag } from '@/components/site/CursorTag';
import { SiteHeader } from '@/components/site/SiteHeader';
import { auth } from '@/lib/auth';

const FEATURES = [
  {
    no: '01',
    title: 'Infinite canvas',
    body: 'Pan, zoom and sketch forever. Boxes, arrows, freehand — no walls, no page breaks.',
    accent: 'var(--accent)',
    tilt: '-rotate-2',
    mark: (
      <path
        d="M6 26c4-10 9-12 13-6s9 3 11-7"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
    ),
  },
  {
    no: '02',
    title: 'Real-time cursors',
    body: 'See every teammate move, draw and select live. Presence that feels like one room.',
    accent: 'var(--coral)',
    tilt: 'rotate-2',
    mark: (
      <path
        d="M9 7l16 8-7 2-2 7-7-17Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
  {
    no: '03',
    title: 'AI copilot',
    body: 'Generate a diagram from a sentence, or summarize a messy board into clean notes.',
    accent: 'var(--accent)',
    tilt: '-rotate-1',
    mark: (
      <path
        d="M18 4l3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
] as const;

export default async function LandingPage() {
  const session = await auth();

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader
        action={
          <Link
            href={session ? '/dashboard' : '/login'}
            className="btn btn-ghost !px-4 !py-2 text-sm"
          >
            {session ? 'Dashboard' : 'Sign in'}
          </Link>
        }
      />

      <main className="flex flex-1 flex-col">
        {/* Hero */}
        <section className="dotgrid relative overflow-hidden px-6 pt-16 pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-hand text-accent mb-4 -rotate-1 text-2xl">
              real-time · infinite · a little bit magic
            </p>
            <h1 className="text-foreground text-5xl leading-[1.05] font-extrabold tracking-tight sm:text-7xl">
              Draw <span className="marker">together</span>.
              <br />
              Think <span className="squiggle">out loud</span>.
            </h1>
            <p className="text-ink-soft mx-auto mt-6 max-w-xl text-lg">
              A collaborative whiteboard with an AI copilot. Sketch on an endless canvas, watch your
              team&apos;s cursors move in real time, and turn a prompt into a diagram.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link href={session ? '/dashboard' : '/login'} className="btn btn-ink text-base">
                {session ? 'Open your boards' : 'Start drawing'} →
              </Link>
              <Link href="#features" className="btn btn-ghost text-base">
                See how it works
              </Link>
            </div>
          </div>

          {/* Scattered presence cursors */}
          <CursorTag
            name="Maya"
            color="var(--coral)"
            className="top-10 left-[12%] hidden sm:flex"
          />
          <CursorTag
            name="Sam"
            color="var(--accent)"
            className="top-28 right-[10%] hidden -rotate-6 sm:flex"
          />
          <CursorTag
            name="you"
            color="#10b981"
            className="bottom-12 left-[20%] hidden rotate-3 md:flex"
          />
        </section>

        {/* Features */}
        <section id="features" className="bg-surface border-line border-y px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-foreground mb-12 text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
              Everything a session needs
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              {FEATURES.map((f) => (
                <article
                  key={f.no}
                  className={`bg-background border-foreground sketch lift ${f.tilt} flex flex-col gap-4 border-2 p-7`}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ color: f.accent }}>
                      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
                        {f.mark}
                      </svg>
                    </span>
                    <span className="text-ink-soft font-mono text-sm">{f.no}</span>
                  </div>
                  <h3 className="text-foreground text-xl font-bold">{f.title}</h3>
                  <p className="text-ink-soft text-sm leading-relaxed">{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Closing call to action */}
        <section className="px-6 py-24 text-center">
          <h2 className="text-foreground mx-auto max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Grab a marker. <span className="marker">Gather the team.</span>
          </h2>
          <div className="mt-8">
            <Link href={session ? '/dashboard' : '/login'} className="btn btn-accent text-base">
              {session ? 'Open your boards' : 'Start drawing free'} →
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-line text-ink-soft mx-auto w-full max-w-6xl border-t px-6 py-8 text-sm">
        <p>
          CollabBoard — built for people who think with their hands.
          <span className="font-hand text-accent ml-2 text-lg">made with care, not templates</span>
        </p>
      </footer>
    </div>
  );
}
