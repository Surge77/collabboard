'use client';

import { useBroadcastEvent, useEventListener, useSelf } from '@liveblocks/react/suspense';
import { useCallback, useState } from 'react';

import { applyVote, isVoteEvent, tallyVotes, type VoteValue } from '@/lib/facilitation';

// Live thumbs up/down temperature check. Each participant's latest vote is kept
// keyed by userId (re-voting overwrites), so the tally reflects distinct voters.
// Ephemeral: not persisted, and late joiners see only votes cast while present.
export function VotePoll() {
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

  const { up, down } = tallyVotes(votes);

  return (
    <div className="pointer-events-auto absolute right-4 bottom-20 flex items-center gap-1 rounded-full border border-black/10 bg-white/90 px-2 py-1 shadow-md backdrop-blur dark:border-white/10 dark:bg-black/70">
      <button
        type="button"
        aria-label="Vote up"
        aria-pressed={myVote === 1}
        onClick={() => cast(1)}
        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-sm transition-colors ${
          myVote === 1
            ? 'bg-green-500/20 text-green-600'
            : 'hover:bg-black/5 dark:hover:bg-white/10'
        }`}
      >
        👍 <span className="tabular-nums">{up}</span>
      </button>
      <button
        type="button"
        aria-label="Vote down"
        aria-pressed={myVote === -1}
        onClick={() => cast(-1)}
        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-sm transition-colors ${
          myVote === -1 ? 'bg-red-500/20 text-red-600' : 'hover:bg-black/5 dark:hover:bg-white/10'
        }`}
      >
        👎 <span className="tabular-nums">{down}</span>
      </button>
    </div>
  );
}
