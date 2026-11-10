import type { ReactNode } from 'react';

import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Wordmark } from '@/components/site/Wordmark';

interface SiteHeaderProps {
  action?: ReactNode;
}

export function SiteHeader({ action }: SiteHeaderProps) {
  return (
    <header className="border-line bg-surface border-b">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Wordmark />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {action}
        </div>
      </div>
    </header>
  );
}
