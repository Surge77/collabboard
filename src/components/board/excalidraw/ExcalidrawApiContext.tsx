'use client';

import { createContext, useContext } from 'react';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';

// tldraw exposes the editor via useEditor(); Excalidraw has no equivalent hook.
// We capture its imperative API at mount and share it through context so sibling
// panels (AI, export) can read/mutate the scene the same way useEditor() allowed.
const ExcalidrawApiContext = createContext<ExcalidrawImperativeAPI | null>(null);

export const ExcalidrawApiProvider = ExcalidrawApiContext.Provider;

export function useExcalidrawApi(): ExcalidrawImperativeAPI {
  const api = useContext(ExcalidrawApiContext);
  if (!api) {
    throw new Error('useExcalidrawApi must be used within an ExcalidrawApiProvider');
  }
  return api;
}
