// Shared field chrome. The strong line keeps every field boundary at 3:1 or
// better (WCAG 1.4.11) in both themes.
export const FIELD_CLASS =
  'w-full rounded-md border border-line-strong bg-surface px-2.5 text-sm text-foreground placeholder:text-ink-soft transition-colors duration-150 hover:border-foreground/60 focus:border-accent-text focus:outline-none disabled:opacity-45';

export const INPUT_CLASS = `${FIELD_CLASS} h-9 pointer-coarse:h-11`;

export const TEXTAREA_CLASS = `${FIELD_CLASS} resize-none py-2 leading-snug`;

export const LABEL_CLASS = 'text-[13px] font-medium text-foreground';
