import { z } from 'zod';

export const PROMPT_MAX = 1000;
const MAX_INPUT_SHAPES = 500;
const MAX_NODES = 24;
const MAX_EDGES = 32;
const ID_MAX = 40;
const NODE_TEXT_MAX = 80;

// tldraw GeoShapeGeoStyle values — `type` maps straight to a geo shape so
// "make a triangle" produces a triangle, not a labelled rectangle.
export const GEO_TYPES = [
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
] as const;

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

const ACTION_ITEM_MAX = 160;
const MAX_ACTION_ITEMS = 20;

// Same shape input as analyze; the model reads the board's text and returns a
// short list of action items. Only bounded strings (no numeric fields) so the
// structured-output number-blowup hazard cannot occur.
export const actionItemsInputSchema = analyzeInputSchema;

export const actionItemsSchema = z.object({
  items: z.array(z.string().min(1).max(ACTION_ITEM_MAX)).max(MAX_ACTION_ITEMS),
});

export type ActionItems = z.infer<typeof actionItemsSchema>;

// The model returns a node-link GRAPH, never coordinates. Asking Gemini for
// pixel x/y produced pathological numbers (hundreds of digits) that overran
// maxOutputTokens and truncated the JSON; layout is now computed deterministically
// from the graph by dagre (see `@/lib/diagram-layout`). `id` is a short model-
// assigned key that edges reference.
const aiNodeSchema = z.object({
  id: z.string().min(1).max(ID_MAX),
  type: z.enum(GEO_TYPES),
  text: z.string().max(NODE_TEXT_MAX).optional(),
});

const aiEdgeSchema = z.object({
  from: z.string().min(1).max(ID_MAX),
  to: z.string().min(1).max(ID_MAX),
  text: z.string().max(NODE_TEXT_MAX).optional(),
});

export const aiGraphSchema = z.object({
  nodes: z.array(aiNodeSchema).min(1).max(MAX_NODES),
  edges: z.array(aiEdgeSchema).max(MAX_EDGES),
  // 'down' for flows/trees/org charts, 'right' for timelines/pipelines.
  direction: z.enum(['down', 'right']).optional(),
});

export type AnalyzeShape = z.infer<typeof analyzeShapeSchema>;
export type AiNode = z.infer<typeof aiNodeSchema>;
export type AiEdge = z.infer<typeof aiEdgeSchema>;
export type AiGraph = z.infer<typeof aiGraphSchema>;
export type GeoType = (typeof GEO_TYPES)[number];
