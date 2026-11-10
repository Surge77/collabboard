'use client';

import { shallow, useOthersMapped, useSelf } from '@liveblocks/react/suspense';

const MAX_VISIBLE = 3;

interface Person {
  name: string;
  color: string;
}

function Avatar({ name, color, isSelf }: Person & { isSelf?: boolean }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <li
      title={isSelf ? `${name} (you)` : name}
      style={{ backgroundColor: color }}
      className="ring-surface flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white ring-2"
    >
      <span aria-hidden="true">{initial}</span>
    </li>
  );
}

// Presence stack for the rail: you first, then up to two others, then a +N
// cell. Selector-based so cursor-rate presence updates do not re-render it.
export function Avatars() {
  const self = useSelf((me) => ({ name: me.info.name, color: me.info.color }), shallow);
  const others = useOthersMapped((o) => ({ name: o.info.name, color: o.info.color }), shallow);

  const visibleOthers = others.slice(0, MAX_VISIBLE - 1);
  const overflow = others.length - visibleOthers.length;
  const names = [`${self.name} (you)`, ...others.map(([, o]) => o.name)].join(', ');

  return (
    <div className="flex flex-col items-center">
      <span className="sr-only">On this board: {names}</span>
      <ul className="flex flex-col items-center gap-1.5" aria-hidden="true">
        <Avatar name={self.name} color={self.color} isSelf />
        {visibleOthers.map(([connectionId, o]) => (
          <Avatar key={connectionId} name={o.name} color={o.color} />
        ))}
        {overflow > 0 ? (
          <li className="bg-hover text-ink-soft ring-surface flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums ring-2">
            +{overflow}
          </li>
        ) : null}
      </ul>
    </div>
  );
}
