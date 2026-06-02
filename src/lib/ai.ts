import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';

import type { AnalyzeShape } from '@/lib/validations/ai';

export const GEMINI_MODEL = 'gemini-2.5-flash';

// Instantiated per call (not at module load) so a missing key fails as a clean
// 500 at request time rather than throwing during the build (see Phase 3).
export function getGeminiModel(): LanguageModel | null {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) return null;
  return createGoogleGenerativeAI({ apiKey })(GEMINI_MODEL);
}

export function buildGeneratePrompt(userPrompt: string): string {
  return [
    'You are a diagramming assistant for a whiteboard.',
    'Convert the request into labelled boxes (rectangle) and ellipses on a 2D canvas.',
    'Rules: x and y are pixels in the 0-1000 range; width ~160, height ~90;',
    'space shapes apart so they do not overlap; at most 16 shapes; every shape has a short text label.',
    `Request: ${userPrompt}`,
  ].join(' ');
}

export function buildAnalyzePrompt(shapes: AnalyzeShape[]): string {
  if (shapes.length === 0) {
    return 'The whiteboard is empty. Reply with exactly: The board is empty.';
  }
  const lines = shapes.map((s) => `- ${s.type}${s.text ? `: "${s.text}"` : ''}`).join('\n');
  return [
    'Summarize this whiteboard in 2-3 plain sentences for a teammate.',
    'Do not list the shapes verbatim; describe what the diagram seems to represent.',
    `Shapes:\n${lines}`,
  ].join('\n');
}
