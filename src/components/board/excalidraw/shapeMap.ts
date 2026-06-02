import type { AiShape } from '@/lib/validations/ai';

// Excalidraw natively supports far fewer primitives than tldraw's geo shapes.
// The AI route still returns tldraw geo names (unchanged server-side); we map
// them to the closest Excalidraw element type here. Everything without a native
// equivalent (triangle, star, cloud, arrows, …) degrades to a labelled
// rectangle so the diagram's text/structure survives even when the silhouette
// can't. This is the known feature downgrade of leaving tldraw.
type ExcalidrawShapeType = 'rectangle' | 'ellipse' | 'diamond';

const GEO_TO_EXCALIDRAW: Partial<Record<AiShape['type'], ExcalidrawShapeType>> = {
  rectangle: 'rectangle',
  ellipse: 'ellipse',
  oval: 'ellipse',
  diamond: 'diamond',
  rhombus: 'diamond',
};

export function toExcalidrawShapeType(geo: AiShape['type']): ExcalidrawShapeType {
  return GEO_TO_EXCALIDRAW[geo] ?? 'rectangle';
}
