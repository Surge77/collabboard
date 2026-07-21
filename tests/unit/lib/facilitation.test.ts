import { describe, expect, it } from 'vitest';

import {
  applyVote,
  CURSOR_CHAT_MAX_LEN,
  CURSOR_CHAT_TTL_MS,
  formatDuration,
  isCursorChatEvent,
  isTimerEvent,
  isVoteEvent,
  pruneCursorChats,
  tallyVotes,
  timerDeadline,
  timerRemainingMs,
  upsertCursorChat,
  type CursorChatBubble,
  type VoteValue,
} from '@/lib/facilitation';

describe('isTimerEvent', () => {
  it('accepts a finite deadline or null', () => {
    expect(isTimerEvent({ type: 'timer', endsAt: 1000 })).toBe(true);
    expect(isTimerEvent({ type: 'timer', endsAt: null })).toBe(true);
  });
  it('rejects wrong type, non-finite, or missing endsAt', () => {
    expect(isTimerEvent({ type: 'vote', endsAt: 1000 })).toBe(false);
    expect(isTimerEvent({ type: 'timer', endsAt: Number.NaN })).toBe(false);
    expect(isTimerEvent({ type: 'timer', endsAt: Infinity })).toBe(false);
    expect(isTimerEvent({ type: 'timer' })).toBe(false);
    expect(isTimerEvent(null)).toBe(false);
  });
});

describe('timerRemainingMs', () => {
  it('returns the clamped span to the deadline', () => {
    expect(timerRemainingMs(5000, 2000)).toBe(3000);
    expect(timerRemainingMs(1000, 4000)).toBe(0);
    expect(timerRemainingMs(null, 4000)).toBe(0);
  });
});

describe('timerDeadline', () => {
  it('computes now + minutes for a valid duration', () => {
    expect(timerDeadline(5, 1000)).toBe(1000 + 5 * 60_000);
  });
  it('rejects non-positive, non-finite, or absurd durations', () => {
    expect(timerDeadline(0, 1000)).toBeNull();
    expect(timerDeadline(-3, 1000)).toBeNull();
    expect(timerDeadline(Number.NaN, 1000)).toBeNull();
    expect(timerDeadline(100_000, 1000)).toBeNull();
  });
});

describe('formatDuration', () => {
  it('formats as m:ss, rounding up partial seconds', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(1500)).toBe('0:02');
    expect(formatDuration(65_000)).toBe('1:05');
    expect(formatDuration(600_000)).toBe('10:00');
  });
});

describe('isCursorChatEvent', () => {
  const base = { type: 'cursor-chat', id: 'u1', name: 'Ann', text: 'hi', x: 0.5, y: 0.5 };
  it('accepts a well-formed bubble', () => {
    expect(isCursorChatEvent(base)).toBe(true);
  });
  it('rejects empty, whitespace, or over-length text', () => {
    expect(isCursorChatEvent({ ...base, text: '' })).toBe(false);
    expect(isCursorChatEvent({ ...base, text: '   ' })).toBe(false);
    expect(isCursorChatEvent({ ...base, text: 'x'.repeat(CURSOR_CHAT_MAX_LEN + 1) })).toBe(false);
  });
  it('rejects out-of-range coordinates and bad ids', () => {
    expect(isCursorChatEvent({ ...base, x: 1.5 })).toBe(false);
    expect(isCursorChatEvent({ ...base, y: -0.1 })).toBe(false);
    expect(isCursorChatEvent({ ...base, id: '' })).toBe(false);
  });
});

describe('cursor chat bubble helpers', () => {
  function bubble(overrides: Partial<CursorChatBubble> = {}): CursorChatBubble {
    return { id: 'u1', name: 'Ann', text: 'hi', x: 0.5, y: 0.5, createdAt: 0, ...overrides };
  }
  it('upsert replaces a same-sender bubble rather than stacking', () => {
    const list = [bubble({ text: 'old' })];
    const next = upsertCursorChat(list, bubble({ text: 'new' }));
    expect(next).toHaveLength(1);
    expect(next[0].text).toBe('new');
  });
  it('prunes bubbles at or past the TTL', () => {
    const list = [bubble({ id: 'fresh', createdAt: 1000 }), bubble({ id: 'stale', createdAt: 0 })];
    const next = pruneCursorChats(list, CURSOR_CHAT_TTL_MS + 500);
    expect(next.map((b) => b.id)).toEqual(['fresh']);
  });
});

describe('isVoteEvent', () => {
  it('accepts up, down, or a retraction', () => {
    expect(isVoteEvent({ type: 'vote', userId: 'u1', value: 1 })).toBe(true);
    expect(isVoteEvent({ type: 'vote', userId: 'u1', value: -1 })).toBe(true);
    expect(isVoteEvent({ type: 'vote', userId: 'u1', value: null })).toBe(true);
  });
  it('rejects out-of-set values and bad ids', () => {
    expect(isVoteEvent({ type: 'vote', userId: 'u1', value: 2 })).toBe(false);
    expect(isVoteEvent({ type: 'vote', userId: '', value: 1 })).toBe(false);
    expect(isVoteEvent({ type: 'reaction', userId: 'u1', value: 1 })).toBe(false);
  });
});

describe('vote tally', () => {
  it('applyVote overwrites a voter and null retracts, immutably', () => {
    const a = applyVote({}, 'u1', 1);
    const b = applyVote(a, 'u1', -1);
    expect(a).toEqual({ u1: 1 });
    expect(b).toEqual({ u1: -1 });
    const c = applyVote(b, 'u1', null);
    expect(c).toEqual({});
  });
  it('tallyVotes counts distinct up and down voters', () => {
    const votes: Record<string, VoteValue> = { u1: 1, u2: 1, u3: -1 };
    expect(tallyVotes(votes)).toEqual({ up: 2, down: 1 });
    expect(tallyVotes({})).toEqual({ up: 0, down: 0 });
  });
});
