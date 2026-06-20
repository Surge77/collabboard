import { Liveblocks } from '@liveblocks/node';

import { auth } from '@/lib/auth';
import { canEditRole, resolveBoardAccess } from '@/lib/authz';
import { boardIdFromRoom, userColor } from '@/lib/liveblocks';
import { rateLimit } from '@/lib/rate-limit';

// Generous ceiling for normal Liveblocks reconnect traffic, but bounds an
// authenticated token-guessing oracle and the DB load it would impose.
const AUTH_RATE_LIMIT = 60;
const WINDOW_MS = 60_000;

function stringField(body: unknown, key: string): string | null {
  if (body && typeof body === 'object' && key in body) {
    const value = (body as Record<string, unknown>)[key];
    if (typeof value === 'string') return value;
  }
  return null;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!(await rateLimit(`lb:auth:${session.user.id}`, AUTH_RATE_LIMIT, WINDOW_MS))) {
    return new Response('Too many requests', { status: 429 });
  }

  const payload: unknown = await request.json().catch(() => null);
  const room = stringField(payload, 'room');
  const shareToken = stringField(payload, 'token');
  const boardId = room ? boardIdFromRoom(room) : null;
  if (!room || !boardId) {
    return new Response('Bad request', { status: 400 });
  }

  // Edit access for the owner and share-link editors; read-only for viewers and
  // public boards. No access (private + no valid token) is rejected. The share
  // token is re-resolved here, so the realtime grant matches the page's decision.
  const access = await resolveBoardAccess(boardId, session.user.id, shareToken);
  if (!access) {
    return new Response('Forbidden', { status: 403 });
  }

  // Instantiated per request (not at module load) so a missing key fails as a
  // clean 500 here rather than throwing during build, and is never used to sign
  // a token with an "undefined" secret.
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    return new Response('Realtime is not configured', { status: 500 });
  }
  const liveblocks = new Liveblocks({ secret });

  const lbSession = liveblocks.prepareSession(session.user.id, {
    userInfo: {
      name: session.user.name ?? session.user.email ?? 'Anonymous',
      color: userColor(session.user.id),
    },
  });
  lbSession.allow(room, canEditRole(access.role) ? lbSession.FULL_ACCESS : lbSession.READ_ACCESS);

  const { body, status } = await lbSession.authorize();
  return new Response(body, { status });
}
