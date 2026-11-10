'use client';

import { useBoardUi } from '@/components/board/board-ui';
import { Button } from '@/components/ui/Button';
import { LABEL_CLASS } from '@/components/ui/field';
import { Icon } from '@/components/ui/Icon';
import { TIMER_PRESETS_MIN } from '@/lib/facilitation';
import { REACTION_EMOJIS } from '@/lib/reactions';

function VoteButton({
  label,
  icon,
  count,
  isPressed,
  onClick,
}: {
  label: string;
  icon: 'thumbUp' | 'thumbDown';
  count: number;
  isPressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isPressed}
      aria-label={`${label}, ${count} ${count === 1 ? 'vote' : 'votes'}`}
      onClick={onClick}
      className={`flex h-9 flex-1 items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors duration-150 pointer-coarse:h-11 ${
        isPressed
          ? 'border-foreground bg-selected text-foreground'
          : 'border-line-strong text-ink-soft hover:bg-hover hover:text-foreground'
      }`}
    >
      <Icon name={icon} size={18} />
      <span className="min-w-[2ch] text-left tabular-nums">{count}</span>
    </button>
  );
}

// Panel body for the Facilitate tab: a shared timer, a live thumbs vote and
// emoji reactions. All of it is ephemeral broadcast; nothing is saved.
export function FacilitatePanel() {
  const { canEdit, timer, votes, reactions } = useBoardUi();

  return (
    <>
      <section aria-labelledby="fac-timer" className="flex flex-col gap-2">
        <h3 id="fac-timer" className={LABEL_CLASS}>
          Timer
        </h3>
        {canEdit ? (
          <div className="grid grid-cols-4 gap-1.5">
            {TIMER_PRESETS_MIN.map((minutes) => (
              <Button key={minutes} size="sm" onClick={() => timer.start(minutes)}>
                {minutes} min
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-ink-soft text-[13px]">Editors can start a timer for everyone.</p>
        )}
        {canEdit && (timer.isRunning || timer.isElapsed) ? (
          <Button size="sm" variant="ghost" onClick={timer.clear} className="self-start">
            Clear timer
          </Button>
        ) : null}
        <p className="text-ink-soft text-xs">
          Everyone sees the countdown at the top of the board.
        </p>
      </section>

      <section aria-labelledby="fac-vote" className="flex flex-col gap-2">
        <h3 id="fac-vote" className={LABEL_CLASS}>
          Quick vote
        </h3>
        <div className="flex gap-1.5">
          <VoteButton
            label="Agree"
            icon="thumbUp"
            count={votes.up}
            isPressed={votes.myVote === 1}
            onClick={() => votes.cast(1)}
          />
          <VoteButton
            label="Disagree"
            icon="thumbDown"
            count={votes.down}
            isPressed={votes.myVote === -1}
            onClick={() => votes.cast(-1)}
          />
        </div>
      </section>

      <section aria-labelledby="fac-react" className="flex flex-col gap-2">
        <h3 id="fac-react" className={LABEL_CLASS}>
          React
        </h3>
        <div className="grid grid-cols-6 gap-1">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-label={`React with ${emoji}`}
              onClick={() => reactions.send(emoji)}
              className="hover:bg-hover flex h-9 items-center justify-center rounded-md text-lg transition-colors duration-150 pointer-coarse:h-11"
            >
              {emoji}
            </button>
          ))}
        </div>
      </section>

      <p className="text-ink-soft border-line border-t pt-4 text-xs">
        Press <kbd className="border-line-strong rounded border px-1 font-sans">/</kbd> anywhere on
        the board to chat at your cursor.
      </p>
    </>
  );
}
