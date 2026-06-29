import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { PrismaClient } from '@prisma/client';
import { encode } from 'next-auth/jwt';

import {
  BOARDS_FILE,
  type BoardKey,
  SESSION_COOKIE,
  STORAGE_STATE,
  TEST_USER,
} from './sync.fixtures';

// cuid-shaped id (matches the room-id guard /^c[a-z0-9]{20,}$/i), unique per run.
const freshBoardId = (): string => `c${crypto.randomBytes(16).toString('hex')}`;

const SESSION_MAX_AGE = 60 * 60; // 1 hour

// Playwright's runner process does not load .env.local (Next does that for the
// app). Parse it here so Prisma (DATABASE_URL) and the JWT mint (AUTH_SECRET)
// have what they need. Existing env wins so CI can override.
function loadEnvLocal(): void {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

async function seedFixtures(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    await prisma.user.upsert({
      where: { id: TEST_USER.id },
      update: { email: TEST_USER.email, name: TEST_USER.name },
      create: { id: TEST_USER.id, email: TEST_USER.email, name: TEST_USER.name },
    });
    const boards: Record<BoardKey, string> = {
      draw: freshBoardId(),
      multi: freshBoardId(),
      remove: freshBoardId(),
    };
    for (const id of Object.values(boards)) {
      await prisma.board.create({
        data: { id, userId: TEST_USER.id, isPublic: true, title: 'E2E Sync Board' },
      });
    }
    fs.mkdirSync(path.dirname(BOARDS_FILE), { recursive: true });
    fs.writeFileSync(BOARDS_FILE, JSON.stringify(boards, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

async function writeStorageState(): Promise<void> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is required for E2E auth — copy .env.local into the worktree');
  }

  // JWT session strategy means a valid signed cookie is a full login; no OAuth
  // round-trip needed. The cookie name doubles as the encryption salt.
  const token = await encode({
    token: { sub: TEST_USER.id, id: TEST_USER.id, name: TEST_USER.name, email: TEST_USER.email },
    secret,
    salt: SESSION_COOKIE,
    maxAge: SESSION_MAX_AGE,
  });

  const state = {
    cookies: [
      {
        name: SESSION_COOKIE,
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax' as const,
        expires: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
      },
    ],
    origins: [],
  };

  fs.mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });
  fs.writeFileSync(STORAGE_STATE, JSON.stringify(state, null, 2));
}

export default async function globalSetup(): Promise<void> {
  loadEnvLocal();
  await seedFixtures();
  await writeStorageState();
}
