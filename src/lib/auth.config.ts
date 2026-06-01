import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';

import type { NextAuthConfig } from 'next-auth';

// Edge-safe Auth.js config: providers + callbacks only, NO database adapter.
// The middleware imports this directly so it can run on the Edge runtime, where
// Prisma is not available. The full server config (auth.ts) spreads this and
// adds the Prisma adapter.
export const authConfig = {
  providers: [Google, GitHub],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    // Gate protected routes. Returning false redirects to the signIn page.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const isProtected =
        nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname.startsWith('/board');

      if (isProtected) return isLoggedIn;
      return true;
    },
    // Persist the user id onto the JWT, then expose it on the session.
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (typeof token.id === 'string' && session.user) {
        session.user.id = token.id;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
