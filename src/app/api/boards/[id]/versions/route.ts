import { Liveblocks } from '@liveblocks/node';

import { apiError, apiSuccess } from '@/lib/api-response';
import { auth } from '@/lib/auth';
import { canEditRole, resolveBoardAccess } from '@/lib/authz';
import { listVersions, saveVersion } from '@/lib/board-versions';
import { rateLimit } from '@/lib/rate-limit';
import { saveVersionSchema } from '@/lib/validations/version';
import { flattenFieldErrors } from '@/lib/zod-errors';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Saving is cost-bearing (Liveblocks fetch + DB insert + prune); bound it per
// user+board, matching the AI routes' throttle.
const SAVE_RATE_LIMIT = 20;
const WINDOW_MS = 60_000;

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to view history', 401);

  const { id } = await params;
  try {
    // Any resolved role may read the version list; no access reads as 404.
    const access = await resolveBoardAccess(id, session.user.id);
    if (!access) return apiError('NOT_FOUND', 'Board not found', 404);
    return apiSuccess(await listVersions(id));
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to load history', 500);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to save a version', 401);

  const body: unknown = await request.json().catch(() => null);
  const parsed = saveVersionSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Invalid version', 422, flattenFieldErrors(parsed.error));
  }

  const { id } = await params;
  try {
    // Saving a checkpoint is an edit-level action.
    const access = await resolveBoardAccess(id, session.user.id);
    if (!access || !canEditRole(access.role)) {
      return apiError('NOT_FOUND', 'Board not found', 404);
    }

    if (!(await rateLimit(`version:save:${session.user.id}:${id}`, SAVE_RATE_LIMIT, WINDOW_MS))) {
      return apiError('RATE_LIMITED', 'Too many requests — slow down', 429);
    }

    // Per request (never at module load) so a missing key fails cleanly here
    // instead of throwing during the CI build.
    const secret = process.env.LIVEBLOCKS_SECRET_KEY;
    if (!secret) return apiError('INTERNAL_ERROR', 'Realtime is not configured', 500);

    const version = await saveVersion(
      new Liveblocks({ secret }),
      id,
      session.user.id,
      parsed.data.label
    );
    if (!version) return apiError('CONFLICT', 'Nothing to save yet', 409);
    return apiSuccess(version, 201);
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to save version', 500);
  }
}
