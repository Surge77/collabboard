interface CursorTagProps {
  name: string;
  color: string;
  className?: string;
}

// A live-collaboration cursor with a name flag — the signature motif of a
// multiplayer canvas, used decoratively around the hero.
export function CursorTag({ name, color, className }: CursorTagProps) {
  return (
    <div className={`pointer-events-none absolute flex items-start gap-1 ${className ?? ''}`}>
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path
          d="M4 3l13 6.5-5.8 1.8L8.8 17 4 3Z"
          fill={color}
          stroke="var(--background)"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="rounded-md px-1.5 py-0.5 text-xs font-semibold text-white shadow-sm"
        style={{ backgroundColor: color }}
      >
        {name}
      </span>
    </div>
  );
}
