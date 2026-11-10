'use client';

import { useBoardUi } from '@/components/board/board-ui';
import { REACTION_TTL_MS } from '@/lib/reactions';

// Floating emotes over the canvas. Sending lives in the Facilitate panel; this
// layer only draws what arrives, and never takes pointer events.
export function Reactions() {
  const { reactions } = useBoardUi().reactions;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden" aria-hidden="true">
      {reactions.map((r) => (
        <span
          key={r.id}
          className="reaction-float absolute bottom-24 text-4xl select-none"
          style={{ left: `${r.x * 100}%`, animationDuration: `${REACTION_TTL_MS}ms` }}
        >
          {r.emoji}
        </span>
      ))}
    </div>
  );
}
