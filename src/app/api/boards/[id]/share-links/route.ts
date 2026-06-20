import { apiError, apiSuccess } from '@/lib/api-response';
import { auth } from '@/lib/auth';
import { getBoard } from '@/lib/boards';
import { createShareLink, listShareLinks, revokeShareLink } from '@/lib/share-links';
import { createShareLinkSchema } from '@/lib/validations/share-link';
import { flattenFieldErrors } from '@/lib/zod-errors';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// All three operations are owner-only: getBoard returns null for a non-owner, so a
// share link can only be minted, listed, or revoked by the board's owner.
async function requireOwnedBoard(id: string, userId: string): Promise<boolean> {
  return (await getBoard(id, userId)) !== null;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to manage sharing', 401);

  const { id } = await params;
  try {
    if (!(await requireOwnedBoard(id, session.user.id))) {
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
    if (!(await requireOwnedBoard(id, session.user.id))) {
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
    if (!(await requireOwnedBoard(id, session.user.id))) {
      return apiError('NOT_FOUND', 'Board not found', 404);
    }
    const revoked = await revokeShareLink(linkId, id);
    if (!revoked) return apiError('NOT_FOUND', 'Share link not found', 404);
    return apiSuccess({ id: linkId });
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to revoke share link', 500);
  }
}
