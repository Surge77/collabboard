import { describe, expect, it } from 'vitest';

import { injectSvgWatermark, watermarkPlacement, WATERMARK_TEXT } from '@/lib/watermark';

describe('watermarkPlacement', () => {
  it('clamps the font size between the min and max bounds', () => {
    expect(watermarkPlacement(100, 100).fontSize).toBe(12); // below min ratio → min
    expect(watermarkPlacement(5000, 5000).fontSize).toBe(28); // above max → max
  });

  it('anchors bottom-right, inset from the edges', () => {
    const p = watermarkPlacement(800, 600);
    expect(p.x).toBeLessThan(800);
    expect(p.x).toBeGreaterThan(700);
    expect(p.y).toBeLessThan(600);
    expect(p.y).toBeGreaterThan(500);
  });
});

describe('injectSvgWatermark', () => {
  it('inserts a text node before the closing svg tag', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>';
    const out = injectSvgWatermark(svg, 800, 600);
    expect(out).toContain(WATERMARK_TEXT);
    expect(out.indexOf('<text')).toBeLessThan(out.indexOf('</svg>'));
    expect(out.endsWith('</svg>')).toBe(true);
  });

  it('escapes markup in custom watermark text', () => {
    const out = injectSvgWatermark('<svg></svg>', 100, 100, 'a<b>&c');
    expect(out).toContain('a&lt;b&gt;&amp;c');
    expect(out).not.toContain('<b>');
  });

  it('returns the input unchanged when there is no closing svg tag', () => {
    expect(injectSvgWatermark('<svg>', 100, 100)).toBe('<svg>');
  });
});
