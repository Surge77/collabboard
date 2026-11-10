'use client';

import { useState } from 'react';
import { useEditor, useValue } from 'tldraw';

import { Button } from '@/components/ui/Button';
import { injectSvgWatermark, watermarkPlacement, WATERMARK_TEXT } from '@/lib/watermark';

// Some browsers cancel a download whose object URL is revoked synchronously.
const REVOKE_DELAY_MS = 1000;
const FILE_BASE = 'whiteboard';

type Format = 'png' | 'svg' | 'pdf';

const FORMATS: { id: Format; label: string; hint: string }[] = [
  { id: 'png', label: 'PNG image', hint: 'Best for slides and chat.' },
  { id: 'svg', label: 'SVG vector', hint: 'Scales cleanly; edit in design tools.' },
  { id: 'pdf', label: 'PDF document', hint: 'One page, ready to print or attach.' },
];

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
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

// Panel body for the Export tab. Fully client-side; available to viewers too,
// since read access implies the right to export what you can already see.
export function ExportMenu() {
  const editor = useEditor();
  const shapeCount = useValue('shapeCount', () => editor.getCurrentPageShapeIds().size, [editor]);
  const [busy, setBusy] = useState<Format | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isEmpty = shapeCount === 0;

  async function exportImage(format: 'png' | 'svg') {
    const { blob, width, height } = await editor.toImage([...editor.getCurrentPageShapeIds()], {
      format,
      background: true,
    });
    const stamped =
      format === 'png'
        ? await watermarkPng(blob, width, height)
        : await watermarkSvg(blob, width, height);
    downloadBlob(stamped, `${FILE_BASE}.${format}`);
  }

  async function exportPdf() {
    const { blob, width, height } = await editor.toImage([...editor.getCurrentPageShapeIds()], {
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
  }

  async function run(format: Format) {
    if (isEmpty || busy) return;
    setBusy(format);
    setError(null);
    try {
      if (format === 'pdf') await exportPdf();
      else await exportImage(format);
    } catch {
      setError(`Could not export the ${format.toUpperCase()}. Try again, or try another format.`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {isEmpty ? (
        <p className="text-ink-soft text-[13px]">
          Draw something first. Empty boards can’t be exported.
        </p>
      ) : (
        <p className="text-ink-soft text-[13px]">
          Exports every shape on this page with a small CollabBoard watermark.
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        {FORMATS.map((f) => (
          <Button
            key={f.id}
            onClick={() => void run(f.id)}
            disabled={isEmpty || busy !== null}
            className="h-auto! flex-col items-start! gap-0! py-2 text-left"
          >
            <span>{busy === f.id ? 'Exporting…' : f.label}</span>
            <span className="text-ink-soft text-xs font-normal">{f.hint}</span>
          </Button>
        ))}
      </div>
      {error ? (
        <p role="alert" className="text-danger text-[13px]">
          {error}
        </p>
      ) : null}
    </>
  );
}
