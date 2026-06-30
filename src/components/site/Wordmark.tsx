import Link from 'next/link';

interface WordmarkProps {
  href?: string;
}

// The mark is a tiny whiteboard with a scribble — a literal nod to the product
// rather than an abstract gradient blob.
export function Wordmark({ href = '/' }: WordmarkProps) {
  return (
    <Link href={href} className="group flex items-center gap-2.5">
      <span className="text-accent grid h-9 w-9 -rotate-3 place-items-center transition-transform group-hover:rotate-0">
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
          <rect x="3" y="4" width="28" height="22" rx="3" stroke="currentColor" strokeWidth="2.4" />
          <path
            d="M8 19c2-5 5-6 7-3s4 1 6-3"
            stroke="var(--coral)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M13 30h8M17 26v4"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="text-foreground text-xl font-extrabold tracking-tight">CollabBoard</span>
    </Link>
  );
}
