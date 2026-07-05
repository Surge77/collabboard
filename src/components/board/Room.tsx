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
      className="bg-foreground/[0.02] text-foreground/40 absolute inset-0 flex items-center justify-center text-sm"
    >
      Connecting…
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
    <LiveblocksProvider authEndpoint={authEndpoint}>
      <RoomProvider id={roomId}>
        <ClientSideSuspense fallback={<CanvasFallback />}>
          <CollabCanvas boardId={boardId} role={role} />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
