// Ephemeral emote reactions broadcast between participants over Liveblocks.
// Nothing is persisted; reactions float on the canvas for a few seconds, then
// expire. Because every event arrives from another (untrusted) client, the wire
// payload is validated against an allowlist before anything renders.

export const REACTION_EMOJIS = ['👍', '❤️', '🎉', '😂', '😮', '🙌'] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

// How long a reaction stays on screen before it is pruned.
export const REACTION_TTL_MS = 4000;

// Upper bound on simultaneously-rendered reactions. A peer flooding broadcasts
// must not grow the render list without limit (client-side DoS guard).
export const MAX_ACTIVE_REACTIONS = 60;

const EMOJI_ALLOWLIST = new Set<string>(REACTION_EMOJIS);

// The shape sent over the wire via useBroadcastEvent. `x` is the horizontal
// position as a 0..1 fraction of the canvas width so it renders consistently
// across differently-sized viewports.
// A `type` (not `interface`): Liveblocks constrains RoomEvent to its `Json`
// type, which an interface fails to satisfy (no implicit index signature).
export type ReactionEvent = {
  type: 'reaction';
  emoji: ReactionEmoji;
  x: number;
};

export interface FloatingReaction {
  id: string;
  emoji: ReactionEmoji;
  x: number;
  createdAt: number;
}

// Type guard for an incoming broadcast event. Rejects anything that is not a
// reaction with an allowlisted emoji and an in-range, finite x fraction.
export function isReactionEvent(data: unknown): data is ReactionEvent {
  if (typeof data !== 'object' || data === null) return false;
  const event = data as Record<string, unknown>;
  if (event.type !== 'reaction') return false;
  if (typeof event.emoji !== 'string' || !EMOJI_ALLOWLIST.has(event.emoji)) return false;
  const { x } = event;
  return typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= 1;
}

// Appends a reaction, keeping at most MAX_ACTIVE_REACTIONS by dropping the
// oldest entries. Returns a new array (callers must not mutate the input).
export function addReaction(
  list: readonly FloatingReaction[],
  reaction: FloatingReaction
): FloatingReaction[] {
  const next = [...list, reaction];
  return next.length > MAX_ACTIVE_REACTIONS ? next.slice(-MAX_ACTIVE_REACTIONS) : next;
}

// Drops reactions older than REACTION_TTL_MS relative to `now`.
export function pruneReactions(list: readonly FloatingReaction[], now: number): FloatingReaction[] {
  return list.filter((r) => now - r.createdAt < REACTION_TTL_MS);
}
