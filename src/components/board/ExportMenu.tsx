'use client';

import { useState } from 'react';
import { useEditor } from 'tldraw';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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
      const { blob } = await editor.toImage(ids, { format, background: true });
      downloadBlob(blob, `${FILE_BASE}.${format}`);
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
      doc.save(`${FILE_BASE}.pdf`);
    } finally {
      setBusy(false);
    }
  }

  const btn =
    'rounded-md border border-black/15 bg-white/95 px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-sm disabled:opacity-40';

  return (
    <div className="pointer-events-auto absolute top-3 right-3 z-[300] flex gap-1.5">
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
