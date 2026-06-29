import '@liveblocks/client';

import type { ReactionEvent } from '@/lib/reactions';

// Global Liveblocks types — read by the @liveblocks/react hooks (useSelf, useOthers)
// and the @liveblocks/node auth endpoint.
declare global {
  interface Liveblocks {
    // userInfo set when authenticating in /api/liveblocks-auth.
    UserMeta: {
      id: string; // exposed as `user.id`
      info: {
        name: string;
        color: string;
      }; // exposed as `user.info`
    };

    // Ephemeral events broadcast between participants (useBroadcastEvent /
    // useEventListener). Receivers still validate the payload at runtime.
    RoomEvent: ReactionEvent;
  }
}

export {};
