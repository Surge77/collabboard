import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));

// Fixed cuid-shaped ids so the spec can navigate to a known board. The id must
// satisfy the room-id guard in src/lib/liveblocks.ts (/^c[a-z0-9]{20,}$/i).
export const TEST_USER = {
  id: 'ce2esyncuser000000000001',
  email: 'e2e-sync@collabboard.test',
  name: 'E2E Sync',
};

export type BoardKey = 'draw' | 'multi' | 'remove';

// global-setup generates a fresh random board id per key each run and writes
// them here, so every run starts from an empty Liveblocks room (no shapes
// accumulating across runs) and the spec can use absolute counts.
export const BOARDS_FILE = path.join(dir, '.auth', 'boards.json');

// Auth.js v5 names the session cookie `authjs.session-token` on non-HTTPS
// origins; this value is also the encryption salt.
export const SESSION_COOKIE = 'authjs.session-token';

export const STORAGE_STATE = path.join(dir, '.auth', 'sync-state.json');
