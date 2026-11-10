'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/Button';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  // Called when the undo window closes without an undo.
  onExpire: () => void;
  durationMs: number;
}

// A single bottom-centre toast offering Undo for a destructive action that is
// held back until the window closes. role="status" announces it politely.
export function UndoToast({ message, onUndo, onExpire, durationMs }: UndoToastProps) {
  useEffect(() => {
    const timer = setTimeout(onExpire, durationMs);
    return () => clearTimeout(timer);
  }, [onExpire, durationMs]);

  return (
    <div
      role="status"
      className="border-line bg-raised text-foreground shadow-pop fixed bottom-5 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-3 rounded-lg border py-1.5 pr-1.5 pl-4 text-sm"
    >
      <span>{message}</span>
      <Button size="sm" variant="ghost" className="text-accent-text font-semibold" onClick={onUndo}>
        Undo
      </Button>
    </div>
  );
}
