import NextAuth from 'next-auth';

import { authConfig } from '@/lib/auth.config';

// Next.js 16 "proxy" convention (formerly "middleware"). Runs on the Edge
// runtime, so it uses the adapter-free authConfig. The `authorized` callback in
// authConfig decides which routes require a session.
export default NextAuth(authConfig).auth;

export const config = {
  // Run on everything except Next internals, the auth API, and static assets.
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
