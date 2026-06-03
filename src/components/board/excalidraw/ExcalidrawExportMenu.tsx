'use client';

import { useState } from 'react';
import { exportToBlob, exportToSvg } from '@excalidraw/excalidraw';

import { useExcalidrawApi } from '@/components/board/excalidraw/ExcalidrawApiContext';

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

export function ExcalidrawExportMenu() {
  const api = useExcalidrawApi();
  const [busy, setBusy] = useState(false);

  function scene() {
    return {
      elements: api.getSceneElements(),
      appState: api.getAppState(),
      files: api.getFiles(),
    };
  }

  async function exportPng() {
    const { elements, appState, files } = scene();
    if (elements.length === 0 || busy) return;
    setBusy(true);
    try {
      const blob = await exportToBlob({
        elements,
        appState: { ...appState, exportBackground: true },
        files,
        mimeType: 'image/png',
      });
      downloadBlob(blob, `${FILE_BASE}.png`);
    } finally {
      setBusy(false);
    }
  }

  async function exportSvg() {
    const { elements, appState, files } = scene();
    if (elements.length === 0 || busy) return;
    setBusy(true);
    try {
      const svg = await exportToSvg({
        elements,
        appState: { ...appState, exportBackground: true },
        files,
      });
      const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
      downloadBlob(blob, `${FILE_BASE}.svg`);
    } finally {
      setBusy(false);
    }
  }

  async function exportPdf() {
    const { elements, appState, files } = scene();
    if (elements.length === 0 || busy) return;
    setBusy(true);
    try {
      const blob = await exportToBlob({
        elements,
        appState: { ...appState, exportBackground: true },
        files,
        mimeType: 'image/png',
      });
      const bitmap = await createImageBitmap(blob);
      const { width, height } = bitmap;
      bitmap.close();
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
    <div className="pointer-events-auto absolute bottom-3 left-1/2 z-[300] flex -translate-x-1/2 gap-1.5">
      <button type="button" className={btn} disabled={busy} onClick={exportPng}>
        PNG
      </button>
      <button type="button" className={btn} disabled={busy} onClick={exportSvg}>
        SVG
      </button>
      <button type="button" className={btn} disabled={busy} onClick={exportPdf}>
        PDF
      </button>
    </div>
  );
}
