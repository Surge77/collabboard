import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { createBoard, listBoards } from '@/lib/boards';
import { createBoardSchema } from '@/lib/validations/board';
import { flattenFieldErrors } from '@/lib/zod-errors';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError('UNAUTHORIZED', 'Sign in to view your boards', 401);
  }

  try {
    const boards = await listBoards(session.user.id);
    return apiSuccess(boards);
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to load boards', 500);
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError('UNAUTHORIZED', 'Sign in to create a board', 401);
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = createBoardSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return apiError(
      'VALIDATION_ERROR',
      'Invalid board data',
      422,
      flattenFieldErrors(parsed.error)
    );
  }

  try {
    const board = await createBoard(session.user.id, parsed.data);
    return apiSuccess(board, 201);
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to create board', 500);
  }
}
