import { PrismaClient } from '@prisma/client';

// Reuse a single PrismaClient across hot reloads in development to avoid
// exhausting the database connection pool (Next.js re-imports modules on edit).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
