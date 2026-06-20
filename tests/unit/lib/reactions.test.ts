import { describe, expect, it } from 'vitest';

import {
  addReaction,
  isReactionEvent,
  MAX_ACTIVE_REACTIONS,
  pruneReactions,
  REACTION_EMOJIS,
  REACTION_TTL_MS,
  type FloatingReaction,
} from '@/lib/reactions';

function floating(overrides: Partial<FloatingReaction> = {}): FloatingReaction {
  return { id: 'r1', emoji: '👍', x: 0.5, createdAt: 0, ...overrides };
}

describe('isReactionEvent', () => {
  it('accepts an allowlisted emoji with an in-range x', () => {
    expect(isReactionEvent({ type: 'reaction', emoji: '🎉', x: 0 })).toBe(true);
    expect(isReactionEvent({ type: 'reaction', emoji: '🎉', x: 1 })).toBe(true);
  });

  it('rejects an emoji outside the allowlist', () => {
    expect(isReactionEvent({ type: 'reaction', emoji: '💣', x: 0.5 })).toBe(false);
  });

  it('rejects a wrong or missing type', () => {
    expect(isReactionEvent({ type: 'cursor', emoji: '👍', x: 0.5 })).toBe(false);
    expect(isReactionEvent({ emoji: '👍', x: 0.5 })).toBe(false);
  });

  it('rejects out-of-range, non-finite, or non-numeric x', () => {
    expect(isReactionEvent({ type: 'reaction', emoji: '👍', x: -0.1 })).toBe(false);
    expect(isReactionEvent({ type: 'reaction', emoji: '👍', x: 1.1 })).toBe(false);
    expect(isReactionEvent({ type: 'reaction', emoji: '👍', x: Number.NaN })).toBe(false);
    expect(isReactionEvent({ type: 'reaction', emoji: '👍', x: Infinity })).toBe(false);
    expect(isReactionEvent({ type: 'reaction', emoji: '👍', x: '0.5' })).toBe(false);
  });

  it('rejects non-object input', () => {
    expect(isReactionEvent(null)).toBe(false);
    expect(isReactionEvent(undefined)).toBe(false);
    expect(isReactionEvent('reaction')).toBe(false);
  });

  it('every advertised emoji passes the guard', () => {
    for (const emoji of REACTION_EMOJIS) {
      expect(isReactionEvent({ type: 'reaction', emoji, x: 0.5 })).toBe(true);
    }
  });
});

describe('addReaction', () => {
  it('appends without mutating the input', () => {
    const list = [floating({ id: 'a' })];
    const next = addReaction(list, floating({ id: 'b' }));
    expect(next.map((r) => r.id)).toEqual(['a', 'b']);
    expect(list).toHaveLength(1);
  });

  it('caps the active list at MAX_ACTIVE_REACTIONS, dropping the oldest', () => {
    const full = Array.from({ length: MAX_ACTIVE_REACTIONS }, (_, i) => floating({ id: `r${i}` }));
    const next = addReaction(full, floating({ id: 'newest' }));
    expect(next).toHaveLength(MAX_ACTIVE_REACTIONS);
    expect(next[0].id).toBe('r1');
    expect(next[next.length - 1].id).toBe('newest');
  });
});

describe('pruneReactions', () => {
  it('keeps reactions younger than the TTL and drops older ones', () => {
    const list = [
      floating({ id: 'fresh', createdAt: 1000 }),
      floating({ id: 'stale', createdAt: 0 }),
    ];
    const now = REACTION_TTL_MS + 500;
    const next = pruneReactions(list, now);
    expect(next.map((r) => r.id)).toEqual(['fresh']);
  });

  it('treats a reaction at exactly the TTL boundary as expired', () => {
    const list = [floating({ id: 'edge', createdAt: 0 })];
    expect(pruneReactions(list, REACTION_TTL_MS)).toHaveLength(0);
  });
});
