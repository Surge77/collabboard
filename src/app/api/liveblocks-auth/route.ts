import { Liveblocks } from '@liveblocks/node';

import { auth } from '@/lib/auth';
import { getViewableBoard } from '@/lib/boards';
import { boardIdFromRoom, userColor } from '@/lib/liveblocks';

function roomFromBody(body: unknown): string | null {
  if (body && typeof body === 'object' && 'room' in body) {
    const room = (body as { room: unknown }).room;
    if (typeof room === 'string') return room;
  }
  return null;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const room = roomFromBody(await request.json().catch(() => null));
  const boardId = room ? boardIdFromRoom(room) : null;
  if (!room || !boardId) {
    return new Response('Bad request', { status: 400 });
  }

  // Owner gets full (edit) access; anyone else gets read-only, but only if the
  // board is public. Non-owners of private boards are rejected.
  const viewable = await getViewableBoard(boardId, session.user.id);
  if (!viewable) {
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
  lbSession.allow(room, viewable.role === 'owner' ? lbSession.FULL_ACCESS : lbSession.READ_ACCESS);

  const { body, status } = await lbSession.authorize();
  return new Response(body, { status });
}
