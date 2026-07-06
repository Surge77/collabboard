// Facilitation kit: ephemeral, broadcast-only collaboration primitives (shared
// countdown timer, cursor chat bubbles, live vote/temperature-check). Nothing is
// persisted — everything rides Liveblocks broadcast events between currently
// connected participants. Every payload arrives from an untrusted peer, so each
// event has a runtime type guard before it touches render state.
//
// Each event is a `type` (not an `interface`): Liveblocks constrains RoomEvent
// to its `Json` type, which an interface fails to satisfy (no index signature).

// ─── Timer ────────────────────────────────────────────────────────────────

// A shared countdown. `endsAt` is an absolute epoch-ms deadline so every client
// counts down independently against the same target; `null` clears the timer.
export type TimerEvent = {
  type: 'timer';
  endsAt: number | null;
};

// Preset durations (minutes) offered in the timer control.
export const TIMER_PRESETS_MIN = [1, 3, 5, 10] as const;

const MS_PER_MINUTE = 60_000;
// Guards against a peer sending an absurd deadline that would render nonsense.
const MAX_TIMER_MS = 24 * 60 * MS_PER_MINUTE;

export function isTimerEvent(data: unknown): data is TimerEvent {
  if (typeof data !== 'object' || data === null) return false;
  const event = data as Record<string, unknown>;
  if (event.type !== 'timer') return false;
  const { endsAt } = event;
  return endsAt === null || (typeof endsAt === 'number' && Number.isFinite(endsAt));
}

// Milliseconds remaining until the deadline, clamped to >= 0. A null/elapsed
// timer reads as 0.
export function timerRemainingMs(endsAt: number | null, now: number): number {
  if (endsAt === null) return 0;
  return Math.max(0, endsAt - now);
}

// A deadline `minutes` from `now`, rejecting out-of-range requests (returns null
// → caller treats as "clear"). Bounds keep both the local and the broadcast
// deadline sane.
export function timerDeadline(minutes: number, now: number): number | null {
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  const ms = minutes * MS_PER_MINUTE;
  if (ms > MAX_TIMER_MS) return null;
  return now + ms;
}

// mm:ss for a millisecond span (used by the timer readout).
export function formatDuration(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// ─── Cursor chat ─────────────────────────────────────────────────────────

// A short-lived message bubble anchored to the sender's cursor. `x`/`y` are
// 0..1 viewport fractions so bubbles land consistently across viewport sizes.
export type CursorChatEvent = {
  type: 'cursor-chat';
  id: string;
  name: string;
  text: string;
  x: number;
  y: number;
};

export const CURSOR_CHAT_TTL_MS = 5000;
export const CURSOR_CHAT_MAX_LEN = 120;
const NAME_MAX_LEN = 64;

export interface CursorChatBubble {
  id: string;
  name: string;
  text: string;
  x: number;
  y: number;
  createdAt: number;
}

function isFraction(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

export function isCursorChatEvent(data: unknown): data is CursorChatEvent {
  if (typeof data !== 'object' || data === null) return false;
  const event = data as Record<string, unknown>;
  if (event.type !== 'cursor-chat') return false;
  if (typeof event.id !== 'string' || event.id.length === 0 || event.id.length > 64) return false;
  if (typeof event.name !== 'string' || event.name.length > NAME_MAX_LEN) return false;
  if (typeof event.text !== 'string') return false;
  const text = event.text.trim();
  if (text.length === 0 || text.length > CURSOR_CHAT_MAX_LEN) return false;
  return isFraction(event.x) && isFraction(event.y);
}

export function pruneCursorChats(
  list: readonly CursorChatBubble[],
  now: number
): CursorChatBubble[] {
  return list.filter((b) => now - b.createdAt < CURSOR_CHAT_TTL_MS);
}

// Replaces any existing bubble from the same sender (keyed by id) so a person
// only ever shows one live bubble, then appends the newest.
export function upsertCursorChat(
  list: readonly CursorChatBubble[],
  bubble: CursorChatBubble
): CursorChatBubble[] {
  return [...list.filter((b) => b.id !== bubble.id), bubble];
}

// ─── Vote / temperature check ──────────────────────────────────────────────

// A live thumbs up/down "temperature check". Each participant's latest value is
// kept keyed by userId, so re-voting overwrites rather than double-counts.
export type VoteValue = 1 | -1;

export type VoteEvent = {
  type: 'vote';
  userId: string;
  value: VoteValue | null; // null retracts the vote
};

export interface VoteTally {
  up: number;
  down: number;
}

export function isVoteEvent(data: unknown): data is VoteEvent {
  if (typeof data !== 'object' || data === null) return false;
  const event = data as Record<string, unknown>;
  if (event.type !== 'vote') return false;
  if (typeof event.userId !== 'string' || event.userId.length === 0 || event.userId.length > 64) {
    return false;
  }
  return event.value === 1 || event.value === -1 || event.value === null;
}

// Applies a vote to the per-user map immutably. A null value clears the entry.
export function applyVote(
  votes: Readonly<Record<string, VoteValue>>,
  userId: string,
  value: VoteValue | null
): Record<string, VoteValue> {
  const next = { ...votes };
  if (value === null) {
    delete next[userId];
  } else {
    next[userId] = value;
  }
  return next;
}

export function tallyVotes(votes: Readonly<Record<string, VoteValue>>): VoteTally {
  let up = 0;
  let down = 0;
  for (const value of Object.values(votes)) {
    if (value === 1) up += 1;
    else down += 1;
  }
  return { up, down };
}
