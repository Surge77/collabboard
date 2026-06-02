import { describe, expect, it } from 'vitest';

import { boardIdFromRoom, boardRoomId, userColor } from '@/lib/liveblocks';

describe('boardRoomId / boardIdFromRoom', () => {
  it('round-trips a board id through the room id', () => {
    expect(boardIdFromRoom(boardRoomId('abc123'))).toBe('abc123');
  });

  it('returns null for a room id without the expected prefix', () => {
    expect(boardIdFromRoom('liveblocks:examples:foo')).toBeNull();
  });
});

describe('userColor', () => {
  it('is deterministic for the same user id', () => {
    expect(userColor('user-1')).toBe(userColor('user-1'));
  });

  it('returns a hex color from the palette', () => {
    expect(userColor('user-1')).toMatch(/^#[0-9A-F]{6}$/i);
  });
});
