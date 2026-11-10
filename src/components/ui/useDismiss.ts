'use client';

import { useEffect, type RefObject } from 'react';

interface DismissOptions {
  open: boolean;
  onDismiss: () => void;
  // The surface that counts as "inside"; pointer-downs elsewhere dismiss.
  containerRef: RefObject<HTMLElement | null>;
  // Focus returns here on dismiss so keyboard users are not dropped at <body>.
  returnFocusRef?: RefObject<HTMLElement | null>;
  closeOnOutside?: boolean;
}

// Escape + outside-click dismissal with focus restore, shared by every popover
// and panel so they all behave the same way.
export function useDismiss({
  open,
  onDismiss,
  containerRef,
  returnFocusRef,
  closeOnOutside = true,
}: DismissOptions) {
  useEffect(() => {
    if (!open) return;

    function dismiss() {
      onDismiss();
      returnFocusRef?.current?.focus();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      dismiss();
    }

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node | null;
      if (!target || containerRef.current?.contains(target)) return;
      if (returnFocusRef?.current?.contains(target)) return;
      onDismiss();
    }

    document.addEventListener('keydown', onKeyDown, true);
    if (closeOnOutside) document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [open, onDismiss, containerRef, returnFocusRef, closeOnOutside]);
}
