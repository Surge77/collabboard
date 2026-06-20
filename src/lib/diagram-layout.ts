import dagre from '@dagrejs/dagre';

import type { AiGraph, GeoType } from '@/lib/validations/ai';

const NODE_W = 160;
const NODE_H = 90;
const NODE_SEP = 60;
const RANK_SEP = 90;

export interface PositionedNode {
  type: GeoType;
  text?: string;
  /** Top-left corner in canvas pixels. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DiagramEdge {
  from: string;
  to: string;
  text?: string;
}

export interface DiagramLayout {
  /** Keyed by the model-assigned node id so edges can resolve their endpoints. */
  nodes: Record<string, PositionedNode>;
  edges: DiagramEdge[];
}

// Turn the model's node-link graph into positioned tldraw-ready nodes + the
// edges that connect them. dagre is deterministic, so layout never depends on
// LLM-chosen coordinates. Edges referencing unknown nodes are dropped (the model
// occasionally emits dangling refs).
export function layoutDiagram(graph: AiGraph): DiagramLayout {
  const validIds = new Set(graph.nodes.map((n) => n.id));
  const edges = graph.edges.filter((e) => validIds.has(e.from) && validIds.has(e.to));

  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: graph.direction === 'right' ? 'LR' : 'TB',
    nodesep: NODE_SEP,
    ranksep: RANK_SEP,
  });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of graph.nodes) {
    g.setNode(node.id, { width: NODE_W, height: NODE_H });
  }
  for (const edge of edges) {
    g.setEdge(edge.from, edge.to);
  }

  dagre.layout(g);

  const nodes: Record<string, PositionedNode> = {};
  for (const node of graph.nodes) {
    // dagre returns the node centre; tldraw geo shapes are positioned by their
    // top-left corner.
    const { x, y } = g.node(node.id);
    nodes[node.id] = {
      type: node.type,
      text: node.text,
      x: Math.round(x - NODE_W / 2),
      y: Math.round(y - NODE_H / 2),
      w: NODE_W,
      h: NODE_H,
    };
  }

  return { nodes, edges };
}
