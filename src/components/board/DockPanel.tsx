'use client';

import { useEffect, useRef, type ReactNode, type RefObject } from 'react';

import { IconButton } from '@/components/ui/IconButton';
import { useDismiss } from '@/components/ui/useDismiss';

export const DOCK_PANEL_ID = 'board-dock-panel';

interface DockPanelProps {
  title: string;
  description?: string;
  onClose: () => void;
  // The rail tab that opened the panel; focus returns there on close.
  returnFocusRef: RefObject<HTMLElement | null>;
  children: ReactNode;
}

// The single side panel every rail tab opens into. Docked beside the canvas on
// wide screens (the canvas shrinks, nothing overlaps tldraw's own chrome) and
// laid over the canvas on narrow ones. Esc closes it; clicking the canvas does
// not, so a panel can stay open while you draw.
export function DockPanel({
  title,
  description,
  onClose,
  returnFocusRef,
  children,
}: DockPanelProps) {
  const ref = useRef<HTMLElement>(null);

  useDismiss({
    open: true,
    onDismiss: onClose,
    containerRef: ref,
    returnFocusRef,
    closeOnOutside: false,
  });

  useEffect(() => {
    ref.current?.focus();
  }, [title]);

  return (
    <section
      ref={ref}
      id={DOCK_PANEL_ID}
      tabIndex={-1}
      aria-labelledby={`${DOCK_PANEL_ID}-title`}
      className="border-line bg-surface shadow-pop absolute inset-y-0 right-12 z-[400] flex w-[min(320px,calc(100vw-3rem))] flex-col border-l focus:outline-none md:static md:z-auto md:w-80 md:shrink-0 md:shadow-none"
    >
      <header className="border-line flex h-12 shrink-0 items-center justify-between gap-2 border-b pr-1.5 pl-4">
        <div className="min-w-0">
          <h2
            id={`${DOCK_PANEL_ID}-title`}
            className="text-foreground truncate text-sm font-semibold"
          >
            {title}
          </h2>
        </div>
        <IconButton
          icon="close"
          label={`Close ${title.toLowerCase()}`}
          size="sm"
          onClick={() => {
            onClose();
            returnFocusRef.current?.focus();
          }}
        />
      </header>
      {description ? (
        <p className="text-ink-soft border-line border-b px-4 py-2.5 text-[13px] leading-snug">
          {description}
        </p>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">{children}</div>
    </section>
  );
}
