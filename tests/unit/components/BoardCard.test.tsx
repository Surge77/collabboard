import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { BoardCard } from '@/components/board/BoardCard';
import type { BoardSummary } from '@/types/board';

const board: BoardSummary = {
  id: 'b1',
  title: 'My board',
  isPublic: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

function renderCard(overrides: Partial<Parameters<typeof BoardCard>[0]> = {}) {
  const onRename = vi.fn();
  const onDuplicate = vi.fn();
  const onDelete = vi.fn();
  render(
    <BoardCard
      board={board}
      isPending={false}
      onRename={onRename}
      onDuplicate={onDuplicate}
      onDelete={onDelete}
      {...overrides}
    />
  );
  return { onRename, onDuplicate, onDelete };
}

describe('BoardCard', () => {
  it('renders the board title as a link to the board', () => {
    renderCard();
    expect(screen.getByRole('link', { name: 'My board' })).toHaveAttribute('href', '/board/b1');
  });

  it('calls onRename with the trimmed new title on Enter', async () => {
    const user = userEvent.setup();
    const { onRename } = renderCard();
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    const input = screen.getByLabelText('Board title');
    await user.clear(input);
    await user.type(input, 'Renamed{Enter}');
    expect(onRename).toHaveBeenCalledWith('b1', 'Renamed');
  });

  it('does not call onRename when the title is unchanged', async () => {
    const user = userEvent.setup();
    const { onRename } = renderCard();
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    await user.type(screen.getByLabelText('Board title'), '{Enter}');
    expect(onRename).not.toHaveBeenCalled();
  });

  it('calls onDelete when Delete is clicked', async () => {
    const user = userEvent.setup();
    const { onDelete } = renderCard();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledWith('b1');
  });

  it('calls onDuplicate when Duplicate is clicked', async () => {
    const user = userEvent.setup();
    const { onDuplicate } = renderCard();
    await user.click(screen.getByRole('button', { name: 'Duplicate' }));
    expect(onDuplicate).toHaveBeenCalledWith('b1');
  });

  it('disables actions while pending', () => {
    renderCard({ isPending: true });
    expect(screen.getByRole('button', { name: 'Rename' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Duplicate' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });
});
