import { generateObject } from 'ai';

import { buildGeneratePrompt, getGeminiModel } from '@/lib/ai';
import { apiError, apiSuccess } from '@/lib/api-response';
import { auth } from '@/lib/auth';
import { getBoard } from '@/lib/boards';
import { rateLimit } from '@/lib/rate-limit';
import { aiShapesSchema, generateInputSchema } from '@/lib/validations/ai';
import { flattenFieldErrors } from '@/lib/zod-errors';

const RATE_LIMIT = 10;
const AI_GLOBAL_LIMIT = 15;
const WINDOW_MS = 60_000;
const MAX_OUTPUT_TOKENS = 1500;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError('UNAUTHORIZED', 'Sign in to use AI', 401);
  }

  // Per-endpoint sub-budget first, then the shared cross-endpoint budget — and
  // the global counter is only consumed when the per-endpoint check passes, so a
  // user cannot drain their shared quota with requests that were already denied.
  const endpointOk = await rateLimit(`ai:generate:${session.user.id}`, RATE_LIMIT, WINDOW_MS);
  const globalOk =
    endpointOk && (await rateLimit(`ai:${session.user.id}`, AI_GLOBAL_LIMIT, WINDOW_MS));
  if (!endpointOk || !globalOk) {
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
