import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { Icon, type IconName } from '@/components/ui/Icon';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  // Required: an icon-only control has no visible text to name it.
  label: string;
  size?: 'sm' | 'md';
}

const SIZES = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
} as const;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, size = 'md', className, type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={`text-ink-soft hover:bg-hover hover:text-foreground inline-flex shrink-0 items-center justify-center rounded-md transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45 pointer-coarse:h-11 pointer-coarse:w-11 ${SIZES[size]} ${className ?? ''}`}
      {...rest}
    >
      <Icon name={icon} size={size === 'sm' ? 16 : 18} />
    </button>
  );
});
