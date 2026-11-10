'use client';

import { useBroadcastEvent, useEventListener, useSelf } from '@liveblocks/react/suspense';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  applyVote,
  isTimerEvent,
  isVoteEvent,
  tallyVotes,
  timerDeadline,
  timerRemainingMs,
  type VoteValue,
} from '@/lib/facilitation';
import {
  addReaction,
  isReactionEvent,
  pruneReactions,
  type FloatingReaction,
  type ReactionEmoji,
} from '@/lib/reactions';

const TICK_MS = 250;
const PRUNE_INTERVAL_MS = 1000;
// Keep emotes clear of the viewport edges so they never clip off-screen.
const REACTION_X_MIN = 0.1;
const REACTION_X_RANGE = 0.8;

export interface TimerState {
  remainingMs: number;
  isRunning: boolean;
  isElapsed: boolean;
  start: (minutes: number) => void;
  clear: () => void;
}

// Shared countdown. The controller broadcasts an absolute deadline; every client
// counts down against it independently. Mounted for the board's lifetime (not
// inside a panel) so a closed panel never misses a broadcast.
export function useTimer(): TimerState {
  const broadcast = useBroadcastEvent();
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  // Read inside the tick so the interval never restarts on each deadline change.
  const endsAtRef = useRef<number | null>(null);

  useEventListener(({ event }) => {
    if (!isTimerEvent(event)) return;
    setEndsAt(event.endsAt);
    setRemainingMs(timerRemainingMs(event.endsAt, Date.now()));
  });

  useEffect(() => {
    endsAtRef.current = endsAt;
  }, [endsAt]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingMs(timerRemainingMs(endsAtRef.current, Date.now()));
    }, TICK_MS);
    return () => clearInterval(interval);
  }, []);

  const start = useCallback(
    (minutes: number) => {
      const deadline = timerDeadline(minutes, Date.now());
      setEndsAt(deadline);
      setRemainingMs(timerRemainingMs(deadline, Date.now()));
      broadcast({ type: 'timer', endsAt: deadline });
    },
    [broadcast]
  );

  const clear = useCallback(() => {
    setEndsAt(null);
    broadcast({ type: 'timer', endsAt: null });
  }, [broadcast]);

  return {
    remainingMs,
    isRunning: endsAt !== null && remainingMs > 0,
    isElapsed: endsAt !== null && remainingMs === 0,
    start,
    clear,
  };
}

export interface VoteState {
  up: number;
  down: number;
  myVote: VoteValue | null;
  cast: (value: VoteValue) => void;
}

// Live thumbs up/down. Each participant's latest vote is keyed by userId, so the
// tally counts distinct voters. Ephemeral: late joiners see only live votes.
export function useVotes(): VoteState {
  const broadcast = useBroadcastEvent();
  const myId = useSelf((me) => me.id);
  const [votes, setVotes] = useState<Record<string, VoteValue>>({});
  const [myVote, setMyVote] = useState<VoteValue | null>(null);

  useEventListener(({ event }) => {
    if (isVoteEvent(event)) setVotes((prev) => applyVote(prev, event.userId, event.value));
  });

  const cast = useCallback(
    (value: VoteValue) => {
      const next = myVote === value ? null : value;
      setMyVote(next);
      setVotes((prev) => applyVote(prev, myId, next));
      broadcast({ type: 'vote', userId: myId, value: next });
    },
    [broadcast, myId, myVote]
  );

  return { ...tallyVotes(votes), myVote, cast };
}

function floatingFrom(emoji: ReactionEmoji, x: number): FloatingReaction {
  return { id: crypto.randomUUID(), emoji, x, createdAt: Date.now() };
}

export interface ReactionState {
  reactions: readonly FloatingReaction[];
  send: (emoji: ReactionEmoji) => void;
}

export function useReactions(): ReactionState {
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
      const x = REACTION_X_MIN + Math.random() * REACTION_X_RANGE;
      // Broadcast does not echo to the sender, so add locally too.
      broadcast({ type: 'reaction', emoji, x });
      setReactions((prev) => addReaction(prev, floatingFrom(emoji, x)));
    },
    [broadcast]
  );

  return { reactions, send };
}
