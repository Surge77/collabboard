'use client';

import { ClientSideSuspense, LiveblocksProvider, RoomProvider } from '@liveblocks/react/suspense';
import { useCallback } from 'react';

import { CollabCanvas } from '@/components/board/CollabCanvas';
import type { BoardRole } from '@/types/board';

interface RoomProps {
  roomId: string;
  boardId: string;
  role: BoardRole;
  shareToken?: string;
}

function CanvasFallback() {
  return (
    <div
      role="status"
      aria-label="Connecting to room"
      className="bg-background text-ink-soft absolute inset-0 flex items-center justify-center text-sm"
    >
      Connecting to the board…
    </div>
  );
}

export function Room({ roomId, boardId, role, shareToken }: RoomProps) {
  // A callback authEndpoint (not a URL string) so the share token rides in the
  // POST body — never in a URL/query that would leak into access logs. The auth
  // route re-resolves access from the token, so a forged token grants nothing.
  const authEndpoint = useCallback(
    async (room?: string) => {
      const res = await fetch('/api/liveblocks-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room, token: shareToken }),
      });
      return res.json();
    },
    [shareToken]
  );

  return (
    // Free-plan badge goes top-right, where the board header reserves room for
    // it, instead of bottom-right over tldraw's help menu.
    <LiveblocksProvider authEndpoint={authEndpoint} badgeLocation="top-right">
      <RoomProvider id={roomId}>
        <ClientSideSuspense fallback={<CanvasFallback />}>
          <CollabCanvas boardId={boardId} role={role} />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
