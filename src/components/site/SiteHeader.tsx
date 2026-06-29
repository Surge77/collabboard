import type { ReactNode } from 'react';

import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Wordmark } from '@/components/site/Wordmark';

interface SiteHeaderProps {
  action?: ReactNode;
}

export function SiteHeader({ action }: SiteHeaderProps) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
      <Wordmark />
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {action}
      </div>
    </header>
  );
}
