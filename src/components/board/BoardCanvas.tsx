'use client';

import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';

interface BoardCanvasProps {
  persistenceKey: string;
}

// Inlined at build time. Undefined on localhost is fine — tldraw only enforces a
// license at production runtime (HTTPS, non-localhost). The Hobby key is added
// at deploy time via NEXT_PUBLIC_TLDRAW_LICENSE_KEY.
const licenseKey = process.env.NEXT_PUBLIC_TLDRAW_LICENSE_KEY;

export function BoardCanvas({ persistenceKey }: BoardCanvasProps) {
  return (
    <div className="absolute inset-0">
      <Tldraw persistenceKey={persistenceKey} licenseKey={licenseKey} />
    </div>
  );
}
