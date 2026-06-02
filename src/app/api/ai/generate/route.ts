import { generateObject } from 'ai';

import { buildGeneratePrompt, getGeminiModel } from '@/lib/ai';
import { apiError, apiSuccess } from '@/lib/api-response';
import { auth } from '@/lib/auth';
import { getBoard } from '@/lib/boards';
import { rateLimit } from '@/lib/rate-limit';
import { aiShapesSchema, generateInputSchema } from '@/lib/validations/ai';
import { flattenFieldErrors } from '@/lib/zod-errors';

const RATE_LIMIT = 10;
const WINDOW_MS = 60_000;
const MAX_OUTPUT_TOKENS = 1500;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError('UNAUTHORIZED', 'Sign in to use AI', 401);
  }

  if (!rateLimit(`ai:generate:${session.user.id}`, RATE_LIMIT, WINDOW_MS)) {
    return apiError('RATE_LIMITED', 'Too many requests — slow down', 429);
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = generateInputSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Invalid input', 422, flattenFieldErrors(parsed.error));
  }

  const board = await getBoard(parsed.data.boardId, session.user.id);
  if (!board) {
    return apiError('NOT_FOUND', 'Board not found', 404);
  }

  const model = getGeminiModel();
  if (!model) {
    return apiError('INTERNAL_ERROR', 'AI is not configured', 500);
  }

  try {
    const { object } = await generateObject({
      model,
      schema: aiShapesSchema,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      prompt: buildGeneratePrompt(parsed.data.prompt),
    });
    return apiSuccess(object.shapes);
  } catch {
    return apiError('INTERNAL_ERROR', 'AI request failed', 500);
  }
}
