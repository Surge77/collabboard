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
const aiShapeSchema = z.object({
  type: z.enum(['rectangle', 'ellipse']),
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  text: z.string().optional(),
});

export const aiShapesSchema = z.object({
  shapes: z.array(aiShapeSchema).max(MAX_OUTPUT_SHAPES),
});

export type AnalyzeShape = z.infer<typeof analyzeShapeSchema>;
export type AiShape = z.infer<typeof aiShapeSchema>;
