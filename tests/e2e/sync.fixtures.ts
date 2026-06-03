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

// One board (room) per test so parallel specs don't share Yjs state.
export const TEST_BOARDS = {
  draw: 'ce2esyncdraw00000000000001',
  multi: 'ce2esyncmulti0000000000001',
  remove: 'ce2esyncremove000000000001',
} as const;

// Auth.js v5 names the session cookie `authjs.session-token` on non-HTTPS
// origins; this value is also the encryption salt.
export const SESSION_COOKIE = 'authjs.session-token';

export const STORAGE_STATE = path.join(dir, '.auth', 'sync-state.json');
