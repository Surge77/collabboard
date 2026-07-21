import { Liveblocks } from '@liveblocks/node';

import { apiError, apiSuccess } from '@/lib/api-response';
import { auth } from '@/lib/auth';
import { canEditRole, resolveBoardAccess } from '@/lib/authz';
import { restoreVersion } from '@/lib/board-versions';
import { rateLimit } from '@/lib/rate-limit';

interface RouteContext {
  params: Promise<{ id: string; versionId: string }>;
}

// Restore broadcasts a canvas-mutating update to every collaborator; throttle
// tightly per user+board so it cannot be used to spam-disrupt a room.
const RESTORE_RATE_LIMIT = 10;
const WINDOW_MS = 60_000;

export async function POST(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to restore a version', 401);

  const { id, versionId } = await params;
  try {
    // Restore overwrites the live canvas for everyone in the room — an
    // edit-level action, gated through the single access chokepoint.
    const access = await resolveBoardAccess(id, session.user.id);
    if (!access || !canEditRole(access.role)) {
      return apiError('NOT_FOUND', 'Board not found', 404);
    }

    if (
      !(await rateLimit(`version:restore:${session.user.id}:${id}`, RESTORE_RATE_LIMIT, WINDOW_MS))
    ) {
      return apiError('RATE_LIMITED', 'Too many requests — slow down', 429);
    }

    const secret = process.env.LIVEBLOCKS_SECRET_KEY;
    if (!secret) return apiError('INTERNAL_ERROR', 'Realtime is not configured', 500);

    const restored = await restoreVersion(new Liveblocks({ secret }), id, versionId);
    if (!restored) return apiError('NOT_FOUND', 'Version not found', 404);
    return apiSuccess({ id: versionId });
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to restore version', 500);
  }
}
