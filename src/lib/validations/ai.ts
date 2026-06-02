import { z } from 'zod';

export const PROMPT_MAX = 1000;
const MAX_INPUT_SHAPES = 500;
const MAX_OUTPUT_SHAPES = 16;

export const generateInputSchema = z.object({
  boardId: z.string().min(1),
  prompt: z.string().trim().min(1, 'Prompt cannot be empty').max(PROMPT_MAX),
});

const analyzeShapeSchema = z.object({
  type: z.string().max(40),
  text: z.string().max(200).optional(),
});

export const analyzeInputSchema = z.object({
  boardId: z.string().min(1),
  shapes: z.array(analyzeShapeSchema).max(MAX_INPUT_SHAPES),
});

// The structured shape the model must return, kept deliberately small so the
// client mapping to tldraw geo shapes is reliable.
// Only bounded, required integer coordinates are model-generated. Width/height
// are NOT: Gemini's structured output emits pathological numbers (hundreds of
// digits) for them, especially on optional fields, overrunning maxOutputTokens
// and truncating the JSON. The client applies fixed default sizes instead.
// Mirrors tldraw's GeoShapeGeoStyle so `type` maps straight to a geo shape and
// "make a triangle" actually produces a triangle, not a labelled rectangle.
const aiShapeSchema = z.object({
  type: z.enum([
    'rectangle',
    'ellipse',
    'triangle',
    'diamond',
    'pentagon',
    'hexagon',
    'octagon',
    'star',
    'rhombus',
    'oval',
    'trapezoid',
    'cloud',
    'heart',
    'x-box',
    'check-box',
    'arrow-right',
    'arrow-left',
    'arrow-up',
    'arrow-down',
  ]),
  x: z.number().int().min(0).max(2000),
  y: z.number().int().min(0).max(2000),
  text: z.string().max(80).optional(),
});

export const aiShapesSchema = z.object({
  shapes: z.array(aiShapeSchema).max(MAX_OUTPUT_SHAPES),
});

export type AnalyzeShape = z.infer<typeof analyzeShapeSchema>;
export type AiShape = z.infer<typeof aiShapeSchema>;
