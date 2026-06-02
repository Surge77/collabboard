'use client';

import { ClientSideSuspense, LiveblocksProvider, RoomProvider } from '@liveblocks/react/suspense';

import { CollabCanvas } from '@/components/board/CollabCanvas';

interface RoomProps {
  roomId: string;
  boardId: string;
  canEdit: boolean;
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

export function Room({ roomId, boardId, canEdit }: RoomProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider id={roomId}>
        <ClientSideSuspense fallback={<CanvasFallback />}>
          <CollabCanvas boardId={boardId} canEdit={canEdit} />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
