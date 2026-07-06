// "Made with CollabBoard" export watermark. The geometry and SVG-injection are
// pure so they can be unit-tested; the canvas rasterisation glue lives in the
// ExportMenu component (needs a real DOM canvas).

export const WATERMARK_TEXT = 'Made with CollabBoard';

// Font size scales gently with the image's larger edge, clamped so it stays
// legible on small exports and unobtrusive on large ones.
const MIN_FONT = 12;
const MAX_FONT = 28;
const FONT_RATIO = 0.02;
const MARGIN_RATIO = 0.6; // padding from the edges, in multiples of the font size

export interface WatermarkPlacement {
  fontSize: number;
  /** Baseline anchor, bottom-right aligned. */
  x: number;
  y: number;
}

export function watermarkPlacement(width: number, height: number): WatermarkPlacement {
  const fontSize = Math.round(
    Math.min(MAX_FONT, Math.max(MIN_FONT, Math.max(width, height) * FONT_RATIO))
  );
  const margin = Math.round(fontSize * MARGIN_RATIO);
  return {
    fontSize,
    x: Math.max(0, width - margin),
    y: Math.max(fontSize, height - margin),
  };
}

// Inserts a bottom-right `<text>` watermark just before the closing tag of an
// SVG export. Returns the original string unchanged if no `</svg>` is present.
export function injectSvgWatermark(
  svg: string,
  width: number,
  height: number,
  text: string = WATERMARK_TEXT
): string {
  const close = svg.lastIndexOf('</svg>');
  if (close === -1) return svg;
  const { fontSize, x, y } = watermarkPlacement(width, height);
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const node =
    `<text x="${x}" y="${y}" text-anchor="end" ` +
    `font-family="sans-serif" font-size="${fontSize}" ` +
    `fill="#000000" fill-opacity="0.4">${escaped}</text>`;
  return svg.slice(0, close) + node + svg.slice(close);
}
