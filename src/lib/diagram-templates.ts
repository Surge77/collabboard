import { layoutDiagram, type DiagramLayout } from '@/lib/diagram-layout';
import type { AiGraph } from '@/lib/validations/ai';

// Deterministic starter diagrams. Unlike AI generation these need no model call:
// each template is a fixed node-link graph laid out by the same dagre pipeline as
// AI output, so a template and a generated diagram render identically.

export type TemplateId = 'flowchart' | 'mindmap' | 'orgchart';

export interface TemplateMeta {
  id: TemplateId;
  label: string;
}

export const DIAGRAM_TEMPLATES: readonly TemplateMeta[] = [
  { id: 'flowchart', label: 'Flowchart' },
  { id: 'mindmap', label: 'Mind map' },
  { id: 'orgchart', label: 'Org chart' },
];

const GRAPHS: Record<TemplateId, AiGraph> = {
  flowchart: {
    direction: 'down',
    nodes: [
      { id: 'a', type: 'ellipse', text: 'Start' },
      { id: 'b', type: 'rectangle', text: 'Step' },
      { id: 'c', type: 'diamond', text: 'Decision?' },
      { id: 'd', type: 'rectangle', text: 'Yes path' },
      { id: 'e', type: 'rectangle', text: 'No path' },
      { id: 'f', type: 'ellipse', text: 'End' },
    ],
    edges: [
      { from: 'a', to: 'b' },
      { from: 'b', to: 'c' },
      { from: 'c', to: 'd', text: 'Yes' },
      { from: 'c', to: 'e', text: 'No' },
      { from: 'd', to: 'f' },
      { from: 'e', to: 'f' },
    ],
  },
  mindmap: {
    direction: 'right',
    nodes: [
      { id: 'root', type: 'ellipse', text: 'Central idea' },
      { id: 'b1', type: 'rectangle', text: 'Branch 1' },
      { id: 'b2', type: 'rectangle', text: 'Branch 2' },
      { id: 'b3', type: 'rectangle', text: 'Branch 3' },
      { id: 'b1a', type: 'rectangle', text: 'Detail' },
      { id: 'b2a', type: 'rectangle', text: 'Detail' },
    ],
    edges: [
      { from: 'root', to: 'b1' },
      { from: 'root', to: 'b2' },
      { from: 'root', to: 'b3' },
      { from: 'b1', to: 'b1a' },
      { from: 'b2', to: 'b2a' },
    ],
  },
  orgchart: {
    direction: 'down',
    nodes: [
      { id: 'ceo', type: 'rectangle', text: 'CEO' },
      { id: 'vp1', type: 'rectangle', text: 'VP Eng' },
      { id: 'vp2', type: 'rectangle', text: 'VP Sales' },
      { id: 't1', type: 'rectangle', text: 'Team A' },
      { id: 't2', type: 'rectangle', text: 'Team B' },
      { id: 't3', type: 'rectangle', text: 'Team C' },
    ],
    edges: [
      { from: 'ceo', to: 'vp1' },
      { from: 'ceo', to: 'vp2' },
      { from: 'vp1', to: 't1' },
      { from: 'vp1', to: 't2' },
      { from: 'vp2', to: 't3' },
    ],
  },
};

export function templateLayout(id: TemplateId): DiagramLayout {
  return layoutDiagram(GRAPHS[id]);
}
