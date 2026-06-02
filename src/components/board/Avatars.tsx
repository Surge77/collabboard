'use client';

import { useOthers, useSelf } from '@liveblocks/react/suspense';

function Avatar({ name, color }: { name: string; color: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <div
      title={name}
      style={{ backgroundColor: color }}
      className="-ml-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white shadow-sm first:ml-0"
    >
      {initial}
    </div>
  );
}

export function Avatars() {
  const others = useOthers();
  const self = useSelf();

  return (
    <div className="flex items-center pr-2 pl-2">
      {self ? <Avatar name={self.info.name} color={self.info.color} /> : null}
      {others.map(({ connectionId, info }) => (
        <Avatar key={connectionId} name={info.name} color={info.color} />
      ))}
    </div>
  );
}
