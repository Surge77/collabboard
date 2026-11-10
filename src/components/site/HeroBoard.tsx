import { Icon, type IconName } from '@/components/ui/Icon';

// An illustrative CollabBoard window: a typed prompt as a node on the canvas,
// wired by a connector into the diagram AI produced from it, with collaborators'
// cursors. All content is demonstration data, drawn in code.

interface Box {
  x: number;
  y: number;
}

interface DiagramLayout {
  viewBox: string;
  prompt: Box & { w: number; h: number; lines: readonly string[] };
  promptPort: Box;
  promptEdge: string;
  nodes: readonly (Box & { label: string })[];
  edges: readonly string[];
}

const NODE_W = 112;
const NODE_H = 44;
const PORT = 7;

// Wide frame: prompt on the left, the flow as a 2×2 loop to its right.
const WIDE: DiagramLayout = {
  viewBox: '0 0 500 240',
  prompt: {
    x: 12,
    y: 78,
    w: 168,
    h: 84,
    lines: ['Signup flow: landing,', 'form, email check,', 'dashboard'],
  },
  promptPort: { x: 180, y: 120 },
  promptEdge: 'M180 120H200V52H220',
  nodes: [
    { label: 'Landing page', x: 220, y: 30 },
    { label: 'Sign-up form', x: 376, y: 30 },
    { label: 'Email check', x: 376, y: 166 },
    { label: 'Dashboard', x: 220, y: 166 },
  ],
  edges: ['M332 52H376', 'M432 74V166', 'M376 188H332'],
};

// Phone frame: prompt stacked above the flow so its text stays legible.
const NARROW: DiagramLayout = {
  viewBox: '0 0 260 280',
  prompt: {
    x: 12,
    y: 10,
    w: 236,
    h: 66,
    lines: ['Signup flow: landing, form,', 'email check, dashboard'],
  },
  promptPort: { x: 68, y: 76 },
  promptEdge: 'M68 76V110',
  nodes: [
    { label: 'Landing page', x: 12, y: 110 },
    { label: 'Sign-up form', x: 136, y: 110 },
    { label: 'Email check', x: 136, y: 214 },
    { label: 'Dashboard', x: 12, y: 214 },
  ],
  edges: ['M124 132H136', 'M192 154V214', 'M136 236H124'],
};

const RAIL: readonly IconName[] = ['ai', 'comment', 'facilitate', 'history', 'export'];

function Cursor({ name, className, tone }: { name: string; className: string; tone: string }) {
  return (
    <div
      className={`pointer-events-none absolute hidden items-start gap-0.5 sm:flex ${className}`}
      aria-hidden="true"
    >
      <svg width="16" height="16" viewBox="0 0 16 16">
        <path d="M2 1.5 13 7l-4.6 1.4L6.5 13 2 1.5Z" fill={tone} stroke="white" strokeWidth="1" />
      </svg>
      <span
        className="mt-3 rounded px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-white"
        style={{ backgroundColor: tone }}
      >
        {name}
      </span>
    </div>
  );
}

function Diagram({
  layout,
  id,
  className,
}: {
  layout: DiagramLayout;
  id: string;
  className: string;
}) {
  const { prompt, promptPort } = layout;
  const arrow = `${id}-arrow`;
  return (
    <svg
      viewBox={layout.viewBox}
      className={`h-auto w-full ${className}`}
      role="img"
      aria-label="A typed prompt, 'Signup flow: landing, form, email check, dashboard', connected to the four-step diagram AI drew from it"
    >
      <defs>
        <marker
          id={arrow}
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0 0 8 4 0 8Z" fill="var(--ink-soft)" />
        </marker>
      </defs>

      <rect
        x={prompt.x}
        y={prompt.y}
        width={prompt.w}
        height={prompt.h}
        rx="6"
        fill="var(--surface)"
        stroke="var(--accent)"
        strokeWidth="1.5"
      />
      <text
        x={prompt.x + 12}
        y={prompt.y + 20}
        fontSize="10"
        fontWeight="600"
        fill="var(--accent-text)"
      >
        AI prompt
      </text>
      {prompt.lines.map((line, i) => (
        <text
          key={line}
          x={prompt.x + 12}
          y={prompt.y + 38 + i * 15}
          fontSize="11.5"
          fill="var(--foreground)"
        >
          {line}
        </text>
      ))}

      <path
        d={layout.promptEdge}
        pathLength={1}
        className="connector-draw"
        stroke="var(--accent)"
        strokeWidth="1.5"
        fill="none"
        markerEnd={`url(#${arrow})`}
      />
      <rect
        x={promptPort.x - PORT / 2}
        y={promptPort.y - PORT / 2}
        width={PORT}
        height={PORT}
        fill="var(--surface)"
        stroke="var(--accent)"
      />

      {layout.edges.map((d, i) => (
        <path
          key={d}
          d={d}
          pathLength={1}
          className="connector-draw"
          style={{ animationDelay: `${500 + i * 250}ms` }}
          stroke="var(--ink-soft)"
          strokeWidth="1.5"
          fill="none"
          markerEnd={`url(#${arrow})`}
        />
      ))}
      {layout.nodes.map((n, i) => (
        <g key={n.label} className="node-in" style={{ animationDelay: `${300 + i * 250}ms` }}>
          <rect
            x={n.x}
            y={n.y}
            width={NODE_W}
            height={NODE_H}
            rx="6"
            fill="var(--surface)"
            stroke="var(--line-strong)"
            strokeWidth="1"
          />
          <text
            x={n.x + NODE_W / 2}
            y={n.y + NODE_H / 2 + 4}
            textAnchor="middle"
            fontSize="12"
            fontWeight="500"
            fill="var(--foreground)"
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function HeroBoard() {
  return (
    <figure className="border-line bg-surface shadow-pop overflow-hidden rounded-lg border">
      <div className="border-line flex h-10 items-center gap-2 border-b px-3 text-xs">
        <span className="text-ink-soft">Boards</span>
        <span className="text-line-strong">/</span>
        <span className="text-foreground font-medium">Signup flow</span>
        <span className="bg-accent text-accent-ink ml-auto rounded px-2 py-1 font-medium">
          Share
        </span>
      </div>

      <div className="flex">
        <div className="bg-background relative min-w-0 flex-1">
          <Diagram layout={WIDE} id="hero-wide" className="hidden sm:block" />
          <Diagram layout={NARROW} id="hero-narrow" className="block sm:hidden" />
          <Cursor name="Maya" tone="#d9480f" className="top-[44%] left-[52%]" />
          <Cursor name="Sam" tone="#2b8a3e" className="top-[4%] left-[86%]" />
          <Cursor name="AI" tone="#2d5bff" className="top-[82%] left-[84%]" />
        </div>

        <div className="border-line text-ink-soft flex w-10 shrink-0 flex-col items-center gap-2 border-l py-3">
          {RAIL.map((icon, i) => (
            <span
              key={icon}
              className={`rounded p-1 ${i === 0 ? 'bg-selected text-foreground' : ''}`}
            >
              <Icon name={icon} size={16} />
            </span>
          ))}
        </div>
      </div>
      <figcaption className="sr-only">
        Illustration of a CollabBoard board with example content.
      </figcaption>
    </figure>
  );
}
