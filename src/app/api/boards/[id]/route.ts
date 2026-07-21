import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { isAdminRole, resolveBoardAccess } from '@/lib/authz';
import { deleteBoard, updateBoard } from '@/lib/boards';
import { updateBoardSchema } from '@/lib/validations/board';
import { flattenFieldErrors } from '@/lib/zod-errors';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError('UNAUTHORIZED', 'Sign in to view this board', 401);
  }

  const { id } = await params;
  try {
    // Any resolved role may read the summary; no access reads as 404.
    const access = await resolveBoardAccess(id, session.user.id);
    if (!access) return apiError('NOT_FOUND', 'Board not found', 404);
    return apiSuccess(access.board);
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to load board', 500);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError('UNAUTHORIZED', 'Sign in to update this board', 401);
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = updateBoardSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return apiError(
      'VALIDATION_ERROR',
      'Invalid board data',
      422,
      flattenFieldErrors(parsed.error)
    );
  }

  const { id } = await params;
  try {
    // Rename + visibility are admin actions — the same gate the ShareDialog
    // renders under, so the UI and the API can never disagree.
    const access = await resolveBoardAccess(id, session.user.id);
    if (!access || !isAdminRole(access.role)) {
      return apiError('NOT_FOUND', 'Board not found', 404);
    }
    const board = await updateBoard(id, parsed.data);
    if (!board) return apiError('NOT_FOUND', 'Board not found', 404);
    return apiSuccess(board);
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to update board', 500);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError('UNAUTHORIZED', 'Sign in to delete this board', 401);
  }

  const { id } = await params;
  try {
    const access = await resolveBoardAccess(id, session.user.id);
    if (!access || !isAdminRole(access.role)) {
      return apiError('NOT_FOUND', 'Board not found', 404);
    }
    const deleted = await deleteBoard(id);
    if (!deleted) return apiError('NOT_FOUND', 'Board not found', 404);
    return apiSuccess({ id });
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to delete board', 500);
  }
}
