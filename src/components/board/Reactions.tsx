'use client';

import { useBroadcastEvent, useEventListener } from '@liveblocks/react/suspense';
import { useCallback, useEffect, useState } from 'react';

import {
  addReaction,
  isReactionEvent,
  pruneReactions,
  REACTION_EMOJIS,
  REACTION_TTL_MS,
  type FloatingReaction,
  type ReactionEmoji,
} from '@/lib/reactions';

const PRUNE_INTERVAL_MS = 1000;
// Keep emotes clear of the viewport edges so they never clip off-screen.
const X_MIN = 0.1;
const X_RANGE = 0.8;

function floatingFrom(emoji: ReactionEmoji, x: number): FloatingReaction {
  return { id: crypto.randomUUID(), emoji, x, createdAt: Date.now() };
}

export function Reactions() {
  const broadcast = useBroadcastEvent();
  const [reactions, setReactions] = useState<readonly FloatingReaction[]>([]);

  // Peers' reactions. The payload is untrusted, so validate before rendering.
  useEventListener(({ event }) => {
    if (!isReactionEvent(event)) return;
    setReactions((prev) => addReaction(prev, floatingFrom(event.emoji, event.x)));
  });

  // Drop expired reactions on a fixed cadence rather than per-reaction timers.
  useEffect(() => {
    const interval = setInterval(() => {
      setReactions((prev) => {
        const next = pruneReactions(prev, Date.now());
        return next.length === prev.length ? prev : next;
      });
    }, PRUNE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const send = useCallback(
    (emoji: ReactionEmoji) => {
      const x = X_MIN + Math.random() * X_RANGE;
      // Broadcast does not echo to the sender, so add locally too.
      broadcast({ type: 'reaction', emoji, x });
      setReactions((prev) => addReaction(prev, floatingFrom(emoji, x)));
    },
    [broadcast]
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {reactions.map((r) => (
        <span
          key={r.id}
          aria-hidden
          className="reaction-float absolute bottom-24 text-4xl select-none"
          style={{ left: `${r.x * 100}%`, animationDuration: `${REACTION_TTL_MS}ms` }}
        >
          {r.emoji}
        </span>
      ))}

      <div className="pointer-events-auto absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1 rounded-full border border-black/10 bg-white/90 px-2 py-1 shadow-md backdrop-blur dark:border-white/10 dark:bg-black/70">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            aria-label={`React with ${emoji}`}
            onClick={() => send(emoji)}
            className="rounded-full px-1.5 py-0.5 text-xl transition-transform hover:scale-125"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
