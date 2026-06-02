'use client';

import 'tldraw/tldraw.css';
import { DefaultStylePanel, Tldraw } from 'tldraw';
import { useSelf } from '@liveblocks/react/suspense';

import { Avatars } from '@/components/board/Avatars';
import { useYjsStore } from '@/components/board/useYjsStore';

// Undefined on localhost is fine — tldraw only enforces a license at production
// runtime. The Hobby key is added at deploy time.
const licenseKey = process.env.NEXT_PUBLIC_TLDRAW_LICENSE_KEY;

export function CollabCanvas() {
  // Selectors (not bare useSelf) avoid re-rendering on every presence change.
  const id = useSelf((me) => me.id);
  const info = useSelf((me) => me.info);

  const store = useYjsStore({
    user: { id, color: info.color, name: info.name },
  });

  return (
    <div className="absolute inset-0">
      <Tldraw
        store={store}
        licenseKey={licenseKey}
        autoFocus
        components={{
          StylePanel: () => (
            <div className="flex flex-col gap-1">
              <Avatars />
              <DefaultStylePanel />
            </div>
          ),
        }}
      />
    </div>
  );
}
