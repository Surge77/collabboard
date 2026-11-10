'use client';

import { forwardRef, type RefObject } from 'react';

import { Avatars } from '@/components/board/Avatars';
import { useBoardUi, type PanelId } from '@/components/board/board-ui';
import { DOCK_PANEL_ID } from '@/components/board/DockPanel';
import { Icon, type IconName } from '@/components/ui/Icon';

interface RailTab {
  id: PanelId;
  label: string;
  icon: IconName;
  editorsOnly: boolean;
}

const TABS: readonly RailTab[] = [
  { id: 'ai', label: 'AI', icon: 'ai', editorsOnly: true },
  { id: 'comments', label: 'Comments', icon: 'comment', editorsOnly: false },
  { id: 'facilitate', label: 'Facilitate', icon: 'facilitate', editorsOnly: false },
  { id: 'history', label: 'Version history', icon: 'history', editorsOnly: true },
  { id: 'export', label: 'Export', icon: 'export', editorsOnly: false },
];

interface RailButtonProps {
  tab: RailTab;
  isActive: boolean;
  badge?: number;
  onToggle: () => void;
}

const RailButton = forwardRef<HTMLButtonElement, RailButtonProps>(function RailButton(
  { tab, isActive, badge, onToggle },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onToggle}
      aria-label={badge ? `${tab.label} (${badge} open)` : tab.label}
      title={tab.label}
      aria-expanded={isActive}
      aria-controls={isActive ? DOCK_PANEL_ID : undefined}
      className={`relative flex h-9 w-9 items-center justify-center rounded-md transition-colors duration-150 pointer-coarse:h-11 pointer-coarse:w-11 ${
        isActive
          ? 'bg-selected text-foreground'
          : 'text-ink-soft hover:bg-hover hover:text-foreground'
      }`}
    >
      <Icon name={tab.icon} />
      {/* Diagram-notation port: marks where the open panel attaches to its tab. */}
      {isActive ? (
        <>
          <span
            aria-hidden="true"
            className="bg-line-strong absolute top-1/2 -left-1.5 h-px w-1.5"
          />
          <span
            aria-hidden="true"
            className="port text-line-strong absolute top-1/2 -left-[10px] -translate-y-1/2"
          />
        </>
      ) : null}
      {badge ? (
        <span className="bg-foreground text-background absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums">
          {badge}
        </span>
      ) : null}
    </button>
  );
});

interface BoardRailProps {
  // One ref per tab so the dock panel can hand focus back on close.
  tabRefs: Record<PanelId, RefObject<HTMLButtonElement | null>>;
}

// The board's one strip of app controls, outside the tldraw canvas so it can
// never cover tldraw's menu, toolbar, style panel or help.
export function BoardRail({ tabRefs }: BoardRailProps) {
  const { canEdit, panel, setPanel, comments } = useBoardUi();
  const openThreads = comments.threads.filter((t) => !t.resolved).length;
  const tabs = TABS.filter((t) => canEdit || !t.editorsOnly);

  return (
    <nav
      aria-label="Board tools"
      className="border-line bg-surface z-[410] flex w-12 shrink-0 flex-col items-center gap-3 border-l py-3"
    >
      <Avatars />
      <div className="bg-line h-px w-6" aria-hidden="true" />
      <div className="flex flex-col items-center gap-1">
        {tabs.map((tab) => (
          <RailButton
            key={tab.id}
            ref={tabRefs[tab.id]}
            tab={tab}
            isActive={panel === tab.id}
            badge={tab.id === 'comments' ? openThreads : undefined}
            onToggle={() => setPanel(panel === tab.id ? null : tab.id)}
          />
        ))}
      </div>
    </nav>
  );
}
