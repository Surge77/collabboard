import '@liveblocks/client';

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
  }
}

export {};
