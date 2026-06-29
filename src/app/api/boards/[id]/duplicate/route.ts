import { Liveblocks } from '@liveblocks/node';

import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { duplicateBoard } from '@/lib/boards';
import { copyBoardCanvas } from '@/lib/liveblocks-server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError('UNAUTHORIZED', 'Sign in to duplicate this board', 401);
  }

  const { id } = await params;
  try {
    const board = await duplicateBoard(id, session.user.id);
    if (!board) return apiError('NOT_FOUND', 'Board not found', 404);

    // Canvas copy is gated by the ownership check above: copyBoardCanvas reads
    // the SOURCE room with the admin secret key (which bypasses Liveblocks ACLs),
    // so it must only run after duplicateBoard has confirmed `id` belongs to this
    // user — reached here only when `board` is non-null. Best-effort: the
    // duplicate already exists, so a missing key or a source board that was never
    // opened leaves the copy empty rather than failing the request. Instantiated
    // per request (never at module load) so a missing secret never throws during
    // the CI build.
    const secret = process.env.LIVEBLOCKS_SECRET_KEY;
    if (secret) {
      const liveblocks = new Liveblocks({ secret });
      await copyBoardCanvas(liveblocks, id, board.id);
    }

    return apiSuccess(board, 201);
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to duplicate board', 500);
  }
}
