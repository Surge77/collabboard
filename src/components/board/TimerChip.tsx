'use client';

import { useBoardUi } from '@/components/board/board-ui';
import { IconButton } from '@/components/ui/IconButton';
import { formatDuration } from '@/lib/facilitation';

// Shared countdown, shown to everyone in tldraw's top-centre slot. The digits
// update in place in a fixed tabular cell; screen readers hear only the start
// and the end through a separate live region, never every tick.
export function TimerChip() {
  const { timer, canEdit } = useBoardUi();
  const { isRunning, isElapsed, remainingMs, clear } = timer;
  // Derived from the two booleans only, so the live region text changes on
  // state transitions and stays identical across ticks.
  const announcement = isElapsed ? "Time's up" : isRunning ? 'Timer started' : '';

  return (
    <>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
      {isRunning || isElapsed ? (
        <div className="border-line bg-raised shadow-pop pointer-events-auto mt-2 flex h-9 items-center gap-1 rounded-lg border pr-1 pl-3">
          <span
            className={`min-w-[5ch] text-sm font-semibold tabular-nums ${isElapsed ? 'text-danger' : 'text-foreground'}`}
          >
            {isElapsed ? "Time's up" : formatDuration(remainingMs)}
          </span>
          {canEdit ? (
            <IconButton icon="close" label="Clear timer" size="sm" onClick={clear} />
          ) : null}
        </div>
      ) : null}
    </>
  );
}
