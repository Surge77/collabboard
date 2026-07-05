import { apiError, apiSuccess } from '@/lib/api-response';
import { auth } from '@/lib/auth';
import { isAdminRole, resolveBoardAccess } from '@/lib/authz';
import { createShareLink, listShareLinks, revokeShareLink } from '@/lib/share-links';
import { createShareLinkSchema } from '@/lib/validations/share-link';
import { flattenFieldErrors } from '@/lib/zod-errors';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// All three operations are admin-only: the creator, explicit board admins, and
// org admins may mint, list, or revoke share links. Everyone else sees a 404.
async function requireBoardAdmin(id: string, userId: string): Promise<boolean> {
  const access = await resolveBoardAccess(id, userId);
  return access !== null && isAdminRole(access.role);
}

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to manage sharing', 401);

  const { id } = await params;
  try {
    if (!(await requireBoardAdmin(id, session.user.id))) {
      return apiError('NOT_FOUND', 'Board not found', 404);
    }
    return apiSuccess(await listShareLinks(id));
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to load share links', 500);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to manage sharing', 401);

  const body: unknown = await request.json().catch(() => null);
  const parsed = createShareLinkSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return apiError(
      'VALIDATION_ERROR',
      'Invalid share link',
      422,
      flattenFieldErrors(parsed.error)
    );
  }

  const { id } = await params;
  try {
    if (!(await requireBoardAdmin(id, session.user.id))) {
      return apiError('NOT_FOUND', 'Board not found', 404);
    }
    const link = await createShareLink(
      id,
      session.user.id,
      parsed.data.role,
      parsed.data.expiresInDays
    );
    return apiSuccess(link, 201);
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to create share link', 500);
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to manage sharing', 401);

  const linkId = new URL(request.url).searchParams.get('linkId');
  if (!linkId) return apiError('VALIDATION_ERROR', 'Missing linkId', 422);

  const { id } = await params;
  try {
    if (!(await requireBoardAdmin(id, session.user.id))) {
      return apiError('NOT_FOUND', 'Board not found', 404);
    }
    const revoked = await revokeShareLink(linkId, id);
    if (!revoked) return apiError('NOT_FOUND', 'Share link not found', 404);
    return apiSuccess({ id: linkId });
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to revoke share link', 500);
  }
}
