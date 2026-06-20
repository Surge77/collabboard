import { Liveblocks, WebhookHandler } from '@liveblocks/node';

import { snapshotBoard } from '@/lib/board-snapshots';
import { boardIdFromRoom } from '@/lib/liveblocks';

// Liveblocks calls this when a board's Yjs doc changes or the last user leaves.
// We verify the signature, then snapshot the room's canvas to Postgres so the
// board survives a room eviction. 2xx is returned for every handled-or-ignored
// case so Liveblocks does not retry-storm; only a bad signature is rejected.
export async function POST(request: Request): Promise<Response> {
  const webhookSecret = process.env.LIVEBLOCKS_WEBHOOK_SECRET;
  const apiSecret = process.env.LIVEBLOCKS_SECRET_KEY;
  // Instantiated per request (never at module load) so missing secrets fail as a
  // clean response at request time rather than throwing during the CI build.
  if (!webhookSecret || !apiSecret) {
    // Safe no-op (never accepts unverified requests), but surface the
    // misconfiguration so a redeploy that drops the secret is detectable.
    console.warn('liveblocks-webhook: secrets not configured, snapshot skipped');
    return new Response(null, { status: 204 });
  }

  const rawBody = await request.text();
  let event;
  try {
    event = new WebhookHandler(webhookSecret).verifyRequest({
      headers: request.headers,
      rawBody,
    });
  } catch {
    return new Response('Invalid signature', { status: 401 });
  }

  // Snapshot when the doc changes or the last participant leaves. The inline
  // guard (not a boolean) lets TypeScript narrow `event` to the two event types
  // that carry a `roomId`.
  if (
    event.type !== 'ydocUpdated' &&
    !(event.type === 'userLeft' && event.data.numActiveUsers === 0)
  ) {
    return new Response(null, { status: 204 });
  }

  // boardIdFromRoom rejects any roomId that is not our `collabboard:board:<cuid>`
  // shape, so a crafted roomId can never reach the database layer.
  const boardId = boardIdFromRoom(event.data.roomId);
  if (!boardId) {
    return new Response(null, { status: 204 });
  }

  await snapshotBoard(new Liveblocks({ secret: apiSecret }), boardId);
  return new Response(null, { status: 200 });
}
