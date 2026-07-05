import { Liveblocks } from '@liveblocks/node';

import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { canEditRole, resolveBoardAccess } from '@/lib/authz';
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
    // Role-gated through the single access chokepoint: editors and admins may
    // duplicate. This is the gate that authorizes the admin-key canvas read
    // below (copyBoardCanvas bypasses Liveblocks ACLs), so it must stay ahead
    // of it. Viewers get a 404, not a copy.
    const access = await resolveBoardAccess(id, session.user.id);
    if (!access || !canEditRole(access.role)) {
      return apiError('NOT_FOUND', 'Board not found', 404);
    }

    const board = await duplicateBoard(access.board.title, session.user.id);

    // Best-effort canvas copy: the duplicate row already exists, so a missing
    // key or a source board that was never opened leaves the copy empty rather
    // than failing the request. Instantiated per request (never at module load)
    // so a missing secret never throws during the CI build.
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
