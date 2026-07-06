import { apiError, apiSuccess } from '@/lib/api-response';
import { auth } from '@/lib/auth';
import { canCommentRole, resolveBoardAccess } from '@/lib/authz';
import { createComment, listThreads } from '@/lib/comments';
import { rateLimit } from '@/lib/rate-limit';
import { createCommentSchema } from '@/lib/validations/comment';
import { flattenFieldErrors } from '@/lib/zod-errors';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const COMMENT_RATE_LIMIT = 30;
const WINDOW_MS = 60_000;

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to view comments', 401);

  const { id } = await params;
  try {
    // Any resolved role may read comments; no access reads as 404.
    const access = await resolveBoardAccess(id, session.user.id);
    if (!access) return apiError('NOT_FOUND', 'Board not found', 404);
    return apiSuccess(await listThreads(id));
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to load comments', 500);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to comment', 401);

  const body: unknown = await request.json().catch(() => null);
  const parsed = createCommentSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Invalid comment', 422, flattenFieldErrors(parsed.error));
  }

  const { id } = await params;
  try {
    const access = await resolveBoardAccess(id, session.user.id);
    if (!access || !canCommentRole(access.role)) {
      return apiError('NOT_FOUND', 'Board not found', 404);
    }

    if (!(await rateLimit(`comment:${session.user.id}:${id}`, COMMENT_RATE_LIMIT, WINDOW_MS))) {
      return apiError('RATE_LIMITED', 'Too many requests — slow down', 429);
    }

    const comment = await createComment(id, session.user.id, parsed.data);
    // Only reachable with a parentId that names no root comment on this board.
    if (!comment) return apiError('NOT_FOUND', 'Parent comment not found', 404);
    return apiSuccess(comment, 201);
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to add comment', 500);
  }
}
