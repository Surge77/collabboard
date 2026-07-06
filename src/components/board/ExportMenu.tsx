'use client';

import { useState } from 'react';
import { useEditor } from 'tldraw';

import { injectSvgWatermark, watermarkPlacement, WATERMARK_TEXT } from '@/lib/watermark';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Rasterises the exported PNG onto a canvas and stamps the watermark bottom-right.
async function watermarkPng(blob: Blob, width: number, height: number): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return blob;
  ctx.drawImage(bitmap, 0, 0, width, height);
  const { fontSize, x, y } = watermarkPlacement(width, height);
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textAlign = 'end';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillText(WATERMARK_TEXT, x, y);
  return new Promise((resolve) => canvas.toBlob((out) => resolve(out ?? blob), 'image/png'));
}

async function watermarkSvg(blob: Blob, width: number, height: number): Promise<Blob> {
  const svg = injectSvgWatermark(await blob.text(), width, height);
  return new Blob([svg], { type: 'image/svg+xml' });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

const FILE_BASE = 'whiteboard';

export function ExportMenu() {
  const editor = useEditor();
  const [busy, setBusy] = useState(false);

  function shapeIds() {
    return [...editor.getCurrentPageShapeIds()];
  }

  async function exportImage(format: 'png' | 'svg') {
    const ids = shapeIds();
    if (ids.length === 0 || busy) return;
    setBusy(true);
    try {
      const { blob, width, height } = await editor.toImage(ids, { format, background: true });
      const stamped =
        format === 'png'
          ? await watermarkPng(blob, width, height)
          : await watermarkSvg(blob, width, height);
      downloadBlob(stamped, `${FILE_BASE}.${format}`);
    } finally {
      setBusy(false);
    }
  }

  async function exportPdf() {
    const ids = shapeIds();
    if (ids.length === 0 || busy) return;
    setBusy(true);
    try {
      const { blob, width, height } = await editor.toImage(ids, {
        format: 'png',
        background: true,
      });
      const dataUrl = await blobToDataUrl(blob);
      // Dynamic import keeps jsPDF (~90KB gzip) out of the initial bundle.
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        orientation: width >= height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [width, height],
      });
      doc.addImage(dataUrl, 'PNG', 0, 0, width, height);
      const { fontSize, x, y } = watermarkPlacement(width, height);
      doc.setFontSize(fontSize);
      // jsPDF has no per-string opacity without the GState plugin; a mid-grey
      // reads as a subtle watermark against a white export background.
      doc.setTextColor(150, 150, 150);
      doc.text(WATERMARK_TEXT, x, y, { align: 'right' });
      doc.save(`${FILE_BASE}.pdf`);
    } finally {
      setBusy(false);
    }
  }

  const btn =
    'rounded-md border border-black/15 bg-white/95 px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-sm disabled:opacity-40';

  return (
    <div className="pointer-events-auto absolute top-3 left-1/2 z-[300] flex -translate-x-1/2 gap-1.5">
      <button type="button" className={btn} disabled={busy} onClick={() => exportImage('png')}>
        PNG
      </button>
      <button type="button" className={btn} disabled={busy} onClick={() => exportImage('svg')}>
        SVG
      </button>
      <button type="button" className={btn} disabled={busy} onClick={exportPdf}>
        PDF
      </button>
    </div>
  );
}
