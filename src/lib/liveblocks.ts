export const ROOM_PREFIX = 'collabboard:board:';

export function boardRoomId(boardId: string): string {
  return `${ROOM_PREFIX}${boardId}`;
}

export function boardIdFromRoom(roomId: string): string | null {
  return roomId.startsWith(ROOM_PREFIX) ? roomId.slice(ROOM_PREFIX.length) : null;
}

// Deterministic per-user cursor/avatar color so the same user is the same color
// across reloads and across other participants' screens.
const PALETTE = [
  '#E54D2E',
  '#E5484D',
  '#D6409F',
  '#8E4EC6',
  '#3E63DD',
  '#0091FF',
  '#12A594',
  '#46A758',
  '#F76B15',
  '#FFC53D',
] as const;

export function userColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
