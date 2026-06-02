import { describe, expect, it } from 'vitest';

import { boardIdFromRoom, boardRoomId, userColor } from '@/lib/liveblocks';

const CUID = 'ckx7p2m9q4r8s1t3u5v7w9y2z';

describe('boardRoomId / boardIdFromRoom', () => {
  it('round-trips a cuid board id through the room id', () => {
    expect(boardIdFromRoom(boardRoomId(CUID))).toBe(CUID);
  });

  it('returns null for a room id without the expected prefix', () => {
    expect(boardIdFromRoom('liveblocks:examples:foo')).toBeNull();
  });

  it('returns null when the suffix is not a valid cuid', () => {
    expect(boardIdFromRoom(boardRoomId('not-a-cuid'))).toBeNull();
    expect(boardIdFromRoom(boardRoomId(''))).toBeNull();
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
