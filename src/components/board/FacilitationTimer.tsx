'use client';

import { useBroadcastEvent, useEventListener } from '@liveblocks/react/suspense';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  formatDuration,
  isTimerEvent,
  timerDeadline,
  timerRemainingMs,
  TIMER_PRESETS_MIN,
} from '@/lib/facilitation';

const TICK_MS = 250;

interface FacilitationTimerProps {
  canControl: boolean;
}

// Shared countdown. The controller broadcasts an absolute deadline; every client
// counts down against it independently. Late joiners miss an in-flight timer
// until the next broadcast — acceptable for an ephemeral facilitation aid.
export function FacilitationTimer({ canControl }: FacilitationTimerProps) {
  const broadcast = useBroadcastEvent();
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  // Read inside the tick so the interval never restarts on each deadline change.
  const endsAtRef = useRef<number | null>(null);

  useEventListener(({ event }) => {
    if (!isTimerEvent(event)) return;
    setEndsAt(event.endsAt);
    setRemaining(timerRemainingMs(event.endsAt, Date.now()));
  });

  useEffect(() => {
    endsAtRef.current = endsAt;
  }, [endsAt]);

  // A single interval owns the readout; setState here runs in the tick callback,
  // not synchronously in the effect body.
  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(timerRemainingMs(endsAtRef.current, Date.now()));
    }, TICK_MS);
    return () => clearInterval(interval);
  }, []);

  const start = useCallback(
    (minutes: number) => {
      const deadline = timerDeadline(minutes, Date.now());
      setEndsAt(deadline);
      setRemaining(timerRemainingMs(deadline, Date.now()));
      broadcast({ type: 'timer', endsAt: deadline });
    },
    [broadcast]
  );

  const clear = useCallback(() => {
    setEndsAt(null);
    broadcast({ type: 'timer', endsAt: null });
  }, [broadcast]);

  const isRunning = endsAt !== null && remaining > 0;
  const isElapsed = endsAt !== null && remaining === 0;

  if (!canControl && !isRunning && !isElapsed) return null;

  return (
    <div className="pointer-events-auto absolute top-16 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-black/10 bg-white/90 px-3 py-1.5 shadow-md backdrop-blur dark:border-white/10 dark:bg-black/70">
      {isRunning || isElapsed ? (
        <span
          className={`font-mono text-sm tabular-nums ${
            isElapsed ? 'text-red-500' : 'text-black/80 dark:text-white/80'
          }`}
          aria-live="polite"
        >
          {isElapsed ? "Time's up" : formatDuration(remaining)}
        </span>
      ) : null}

      {canControl ? (
        <div className="flex items-center gap-1">
          {!isRunning
            ? TIMER_PRESETS_MIN.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => start(minutes)}
                  className="rounded-full px-2 py-0.5 text-xs font-medium text-black/70 transition-colors hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10"
                >
                  {minutes}m
                </button>
              ))
            : null}
          {isRunning || isElapsed ? (
            <button
              type="button"
              onClick={clear}
              aria-label="Clear timer"
              className="rounded-full px-2 py-0.5 text-xs font-medium text-black/70 transition-colors hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10"
            >
              Clear
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
