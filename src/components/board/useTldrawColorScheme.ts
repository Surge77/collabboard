'use client';

import { useEffect } from 'react';
import type { Editor } from 'tldraw';

function currentScheme(): 'dark' | 'light' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

// Keeps tldraw's canvas theme in step with the app's `.dark` class, including
// when the user flips the toggle mid-session, so the canvas never stays light
// under dark chrome.
export function useTldrawColorScheme(editor: Editor | null) {
  useEffect(() => {
    if (!editor) return;
    const apply = () => editor.user.updateUserPreferences({ colorScheme: currentScheme() });
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [editor]);
}
