'use client';

import { useBroadcastEvent, useEventListener, useSelf } from '@liveblocks/react/suspense';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  CURSOR_CHAT_MAX_LEN,
  isCursorChatEvent,
  pruneCursorChats,
  upsertCursorChat,
  type CursorChatBubble,
} from '@/lib/facilitation';

const PRUNE_INTERVAL_MS = 1000;

function isTypingTarget(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || (el as HTMLElement).isContentEditable;
}

// Figma-style cursor chat: press "/" to open an input at your cursor, type, and
// Enter broadcasts a bubble anchored at your cursor (0..1 viewport fractions).
// Bubbles expire after CURSOR_CHAT_TTL_MS. Purely ephemeral.
export function CursorChat() {
  const broadcast = useBroadcastEvent();
  const myId = useSelf((me) => me.id);
  const myName = useSelf((me) => me.info.name);

  const [text, setText] = useState('');
  const [bubbles, setBubbles] = useState<readonly CursorChatBubble[]>([]);
  // The 0..1 viewport-fraction position where the input opened; null when closed.
  // Captured once on open so render never reads a live ref.
  const [openAt, setOpenAt] = useState<{ x: number; y: number } | null>(null);
  // Last pointer position as 0..1 viewport fractions, updated on every move.
  const pointer = useRef({ x: 0.5, y: 0.5 });
  const inputRef = useRef<HTMLInputElement>(null);
  const open = openAt !== null;

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !open && !isTypingTarget(document.activeElement)) {
        e.preventDefault();
        setOpenAt({ ...pointer.current });
      } else if (e.key === 'Escape' && open) {
        setOpenAt(null);
        setText('');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEventListener(({ event }) => {
    if (!isCursorChatEvent(event)) return;
    setBubbles((prev) =>
      upsertCursorChat(prev, {
        id: event.id,
        name: event.name,
        text: event.text,
        x: event.x,
        y: event.y,
        createdAt: Date.now(),
      })
    );
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setBubbles((prev) => {
        const next = pruneCursorChats(prev, Date.now());
        return next.length === prev.length ? prev : next;
      });
    }, PRUNE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const send = useCallback(() => {
    const trimmed = text.trim();
    if (trimmed.length === 0 || openAt === null) {
      setOpenAt(null);
      return;
    }
    const { x, y } = openAt;
    broadcast({ type: 'cursor-chat', id: myId, name: myName, text: trimmed, x, y });
    setBubbles((prev) =>
      upsertCursorChat(prev, { id: myId, name: myName, text: trimmed, x, y, createdAt: Date.now() })
    );
    setText('');
    setOpenAt(null);
  }, [broadcast, myId, myName, text, openAt]);

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="absolute max-w-xs -translate-y-full rounded-lg rounded-bl-none bg-black/80 px-2 py-1 text-sm text-white shadow-md"
          style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%` }}
        >
          <span className="mr-1 opacity-60">{b.name}:</span>
          {b.text}
        </div>
      ))}

      {openAt ? (
        <input
          ref={inputRef}
          value={text}
          maxLength={CURSOR_CHAT_MAX_LEN}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => setOpenAt(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send();
          }}
          placeholder="Say something…"
          aria-label="Cursor chat message"
          className="pointer-events-auto absolute w-56 rounded-lg border border-black/10 bg-white px-2 py-1 text-sm shadow-lg outline-none dark:border-white/10 dark:bg-neutral-800"
          style={{ left: `${openAt.x * 100}%`, top: `${openAt.y * 100}%` }}
        />
      ) : null}
    </div>
  );
}
