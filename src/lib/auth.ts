import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';

import { authConfig } from '@/lib/auth.config';
import { db } from '@/lib/db';

// Full server-side Auth.js instance: edge-safe config + Prisma adapter.
// JWT session strategy keeps middleware auth checks Edge-compatible while the
// adapter still persists users and OAuth accounts to Postgres.
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  ...authConfig,
});
