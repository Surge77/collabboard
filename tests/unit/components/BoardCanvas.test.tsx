import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// tldraw is a heavy DOM-only package; stub it so the wrapper can be unit-tested.
vi.mock('tldraw', () => ({
  Tldraw: (props: { persistenceKey: string; licenseKey?: string }) => (
    <div
      data-testid="tldraw"
      data-persistence-key={props.persistenceKey}
      data-has-license={String(Boolean(props.licenseKey))}
    />
  ),
}));
vi.mock('tldraw/tldraw.css', () => ({}));

import { BoardCanvas } from '@/components/board/BoardCanvas';

describe('BoardCanvas', () => {
  it('renders Tldraw with the namespaced persistence key', () => {
    render(<BoardCanvas persistenceKey="collabboard-b1" />);
    expect(screen.getByTestId('tldraw')).toHaveAttribute('data-persistence-key', 'collabboard-b1');
  });
});
