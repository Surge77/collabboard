import { apiError, apiSuccess } from '@/lib/api-response';
import { auth } from '@/lib/auth';
import { canCommentRole, isAdminRole, resolveBoardAccess } from '@/lib/authz';
import { deleteComment, setCommentResolved } from '@/lib/comments';
import { rateLimit } from '@/lib/rate-limit';
import { updateCommentSchema } from '@/lib/validations/comment';
import { flattenFieldErrors } from '@/lib/zod-errors';

interface RouteContext {
  params: Promise<{ id: string; commentId: string }>;
}

// Each successful mutation broadcasts a refetch to every peer, so an unthrottled
// PATCH/DELETE loop amplifies into GET fan-out across the room — same budget as POST.
const COMMENT_MUTATION_LIMIT = 30;
const WINDOW_MS = 60_000;

const CUID = /^c[a-z0-9]{24}$/;

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to update comments', 401);

  const body: unknown = await request.json().catch(() => null);
  const parsed = updateCommentSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Invalid update', 422, flattenFieldErrors(parsed.error));
  }

  const { id, commentId } = await params;
  if (!CUID.test(commentId)) return apiError('NOT_FOUND', 'Comment not found', 404);
  try {
    // Resolving a thread is a collaboration action — commenter and above.
    const access = await resolveBoardAccess(id, session.user.id);
    if (!access || !canCommentRole(access.role)) {
      return apiError('NOT_FOUND', 'Board not found', 404);
    }
    if (!(await rateLimit(`comment:${session.user.id}:${id}`, COMMENT_MUTATION_LIMIT, WINDOW_MS))) {
      return apiError('RATE_LIMITED', 'Too many requests — slow down', 429);
    }
    const ok = await setCommentResolved(id, commentId, parsed.data.resolved);
    if (!ok) return apiError('NOT_FOUND', 'Comment not found', 404);
    return apiSuccess({ id: commentId, resolved: parsed.data.resolved });
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to update comment', 500);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to delete comments', 401);

  const { id, commentId } = await params;
  if (!CUID.test(commentId)) return apiError('NOT_FOUND', 'Comment not found', 404);
  try {
    const access = await resolveBoardAccess(id, session.user.id);
    if (!access || !canCommentRole(access.role)) {
      return apiError('NOT_FOUND', 'Board not found', 404);
    }
    if (!(await rateLimit(`comment:${session.user.id}:${id}`, COMMENT_MUTATION_LIMIT, WINDOW_MS))) {
      return apiError('RATE_LIMITED', 'Too many requests — slow down', 429);
    }
    // Board admins may delete anyone's comment; everyone else only their own.
    // Deleting a root cascades to its replies (schema onDelete: Cascade) — standard
    // thread semantics: removing a thread removes the conversation under it.
    const ok = await deleteComment(id, commentId, session.user.id, isAdminRole(access.role));
    if (!ok) return apiError('NOT_FOUND', 'Comment not found', 404);
    return apiSuccess({ id: commentId });
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to delete comment', 500);
  }
}
