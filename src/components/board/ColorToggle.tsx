'use client';

import { useState } from 'react';
import { DefaultColorStyle, useEditor } from 'tldraw';

type ColorName = 'black' | 'blue' | 'green' | 'red' | 'orange' | 'violet' | 'yellow';

const COLORS: { name: ColorName; hex: string }[] = [
  { name: 'black', hex: '#1d1d1d' },
  { name: 'blue', hex: '#4263eb' },
  { name: 'green', hex: '#099268' },
  { name: 'red', hex: '#e03131' },
  { name: 'orange', hex: '#f76707' },
  { name: 'violet', hex: '#ae3ec9' },
  { name: 'yellow', hex: '#f08c00' },
];

export function ColorToggle() {
  const editor = useEditor();
  const [open, setOpen] = useState(false);

  function pick(name: ColorName) {
    // Apply to the current selection (if any) and to whatever is drawn next, so
    // the palette works whether or not a shape is selected.
    editor.setStyleForSelectedShapes(DefaultColorStyle, name);
    editor.setStyleForNextShapes(DefaultColorStyle, name);
  }

  return (
    <div className="pointer-events-auto absolute bottom-20 left-3 z-[300] flex items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-pressed={open}
        className="rounded-md border border-black/15 bg-white/95 px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-sm"
      >
        {open ? 'Colors ✕' : 'Colors'}
      </button>
      {open ? (
        <div className="flex gap-1 rounded-lg border border-black/10 bg-white/95 p-1.5 shadow-lg">
          {COLORS.map((c) => (
            <button
              key={c.name}
              type="button"
              title={c.name}
              onClick={() => pick(c.name)}
              style={{ backgroundColor: c.hex }}
              className="h-6 w-6 rounded-full border border-black/15 transition-transform hover:scale-110"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
