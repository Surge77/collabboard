import { Liveblocks } from '@liveblocks/node';
import { generateObject } from 'ai';

import { buildGeneratePrompt, getGeminiModel } from '@/lib/ai';
import { writeAgentDiagram } from '@/lib/ai-agent';
import { apiError, apiSuccess } from '@/lib/api-response';
import { auth } from '@/lib/auth';
import { canEditRole, resolveBoardAccess } from '@/lib/authz';
import { layoutDiagram } from '@/lib/diagram-layout';
import { rateLimit } from '@/lib/rate-limit';
import { aiGraphSchema, generateInputSchema } from '@/lib/validations/ai';
import { flattenFieldErrors } from '@/lib/zod-errors';

// Tighter than the read-only generate endpoint: each call mutates the SHARED
// canvas for everyone in the room, so an editor looping it is a disruption/spam
// vector, not just a cost one. Half the generate budget.
const RATE_LIMIT = 5;
const AI_GLOBAL_LIMIT = 15;
const WINDOW_MS = 60_000;
const MAX_OUTPUT_TOKENS = 1500;

// The AI participant: generates a diagram from the prompt and writes it directly
// into the board's live canvas (server-side Yjs), so it lands for every
// collaborator like any other editor's edit.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError('UNAUTHORIZED', 'Sign in to use AI', 401);
  }

  // Per-endpoint sub-budget first, then the shared cross-endpoint budget.
  const endpointOk = await rateLimit(`ai:agent:${session.user.id}`, RATE_LIMIT, WINDOW_MS);
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

  // The AI mutates the live canvas for everyone in the room — an edit-level
  // action, gated through the single access chokepoint.
  const access = await resolveBoardAccess(parsed.data.boardId, session.user.id);
  if (!access || !canEditRole(access.role)) {
    return apiError('NOT_FOUND', 'Board not found', 404);
  }

  const model = getGeminiModel();
  if (!model) {
    return apiError('INTERNAL_ERROR', 'AI is not configured', 500);
  }

  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    return apiError('INTERNAL_ERROR', 'Realtime is not configured', 500);
  }

  try {
    const { object } = await generateObject({
      model,
      schema: aiGraphSchema,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      prompt: buildGeneratePrompt(parsed.data.prompt),
    });
    const layout = layoutDiagram(object);
    const result = await writeAgentDiagram(new Liveblocks({ secret }), parsed.data.boardId, layout);
    if (result === 'no-canvas') {
      return apiError('CONFLICT', 'Open the board before asking the AI to draw', 409);
    }
    return apiSuccess({ nodes: Object.keys(layout.nodes).length });
  } catch (error) {
    // Log before the generic 500: this path wraps both Gemini and three
    // Liveblocks calls, and it's the app's most sensitive write — operators need
    // to tell a quota error from a room/auth error from a bug.
    console.error('ai/agent failed', error);
    return apiError('INTERNAL_ERROR', 'AI request failed', 500);
  }
}
