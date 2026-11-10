import Link from 'next/link';

interface WordmarkProps {
  href?: string;
}

// The mark is a tiny whiteboard on its stand, holding two nodes and the
// connector between them: the product's own diagram notation.
export function Wordmark({ href = '/' }: WordmarkProps) {
  return (
    <Link
      href={href}
      className="text-foreground flex items-center gap-2"
      aria-label="CollabBoard home"
    >
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <rect x="2" y="3" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <rect x="6" y="8" width="5" height="5" rx="0.5" fill="var(--accent)" />
        <rect x="15" y="8" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M11 10.5h4" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M9 23l2-4M17 23l-2-4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[15px] font-semibold tracking-[-0.01em]">CollabBoard</span>
    </Link>
  );
}
