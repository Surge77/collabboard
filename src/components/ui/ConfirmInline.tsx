'use client';

import { useEffect, useRef, type ReactNode } from 'react';

import { Button } from '@/components/ui/Button';

interface ConfirmInlineProps {
  message: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isBusy?: boolean;
  tone?: 'danger' | 'primary';
}

// An in-place "are you sure" row for actions that affect shared state. Inline
// rather than a modal: the question sits next to the thing it is about, and
// focus lands on Cancel so a stray Enter never confirms.
export function ConfirmInline({
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  isBusy = false,
  tone = 'danger',
}: ConfirmInlineProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  return (
    <div
      role="alertdialog"
      aria-label={confirmLabel}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onCancel();
        }
      }}
      className="border-line-strong bg-raised flex flex-col gap-2 rounded-md border p-2.5"
    >
      <p className="text-foreground text-[13px] leading-snug">{message}</p>
      <div className="flex justify-end gap-1.5">
        <Button ref={cancelRef} size="sm" variant="ghost" onClick={onCancel} disabled={isBusy}>
          Cancel
        </Button>
        <Button
          size="sm"
          variant={tone === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
          disabled={isBusy}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
