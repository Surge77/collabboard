'use client';

import { useSyncExternalStore } from 'react';

import { IconButton } from '@/components/ui/IconButton';

// Subscribe to the live `.dark` class on <html> instead of mirroring it into
// React state from an effect. getServerSnapshot returns false so SSR matches
// the pre-paint script's default, and the MutationObserver keeps the icon in
// sync if the class changes from anywhere.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.classList.contains('dark');
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, () => false);

  function toggle() {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  return (
    <IconButton
      icon={isDark ? 'moon' : 'sun'}
      label="Toggle dark mode"
      aria-pressed={isDark}
      onClick={toggle}
    />
  );
}
