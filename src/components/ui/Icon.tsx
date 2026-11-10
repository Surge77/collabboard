import type { ReactNode, SVGProps } from 'react';

// One authored icon set: 20px grid, 1.6 stroke, round joins. Paths are kept
// geometric so every glyph reads at the same weight beside tldraw's own icons.
const PATHS = {
  ai: (
    <>
      <path d="M10 2.8l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5 1.5-4Z" />
      <path d="M15.5 13.5l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6.6-1.6Z" />
    </>
  ),
  comment: (
    <path d="M4 4.5h12a1 1 0 0 1 1 1v7.5a1 1 0 0 1-1 1H9l-3.5 3v-3H4a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Z" />
  ),
  history: (
    <>
      <path d="M3.5 10a6.5 6.5 0 1 0 1.9-4.6" />
      <path d="M3.5 3.5v3.2h3.2" />
      <path d="M10 6.5V10l2.5 1.8" />
    </>
  ),
  facilitate: (
    <>
      <circle cx="10" cy="11" r="6" />
      <path d="M10 8v3.2l2 1.3M8 2.8h4" />
    </>
  ),
  export: (
    <>
      <path d="M10 3v9.5M6.2 8.8 10 12.6l3.8-3.8" />
      <path d="M3.5 13.5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2" />
    </>
  ),
  close: <path d="M5 5l10 10M15 5 5 15" />,
  pencil: <path d="M12.5 4.5l3 3L7 16H4v-3l8.5-8.5Z" />,
  copy: (
    <>
      <rect x="7" y="7" width="9" height="9" rx="1" />
      <path d="M4 13V5a1 1 0 0 1 1-1h8" />
    </>
  ),
  plus: <path d="M10 4v12M4 10h12" />,
  back: <path d="M12 4.5 6.5 10l5.5 5.5" />,
  link: (
    <>
      <path d="M8.5 11.5a3 3 0 0 0 4.2 0l2.6-2.6a3 3 0 0 0-4.2-4.2l-.8.8" />
      <path d="M11.5 8.5a3 3 0 0 0-4.2 0l-2.6 2.6a3 3 0 0 0 4.2 4.2l.8-.8" />
    </>
  ),
  trash: <path d="M4 6h12M8 6V4.5h4V6M5.5 6l.8 10h7.4l.8-10" />,
  check: <path d="M4.5 10.5 8 14l7.5-8" />,
  more: (
    <>
      <circle cx="5" cy="10" r="1" fill="currentColor" />
      <circle cx="10" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
    </>
  ),
  search: (
    <>
      <circle cx="9" cy="9" r="5" />
      <path d="m13 13 3.5 3.5" />
    </>
  ),
  thumbUp: (
    <path d="M6.5 9 9.5 3.5a1.8 1.8 0 0 1 2 2.4L11 8.5h4a1.5 1.5 0 0 1 1.5 1.8l-1.2 5A1.5 1.5 0 0 1 13.8 16.5H6.5V9Zm0 0H3.5v7.5h3" />
  ),
  thumbDown: (
    <path d="M13.5 11l-3 5.5a1.8 1.8 0 0 1-2-2.4L9 11.5H5a1.5 1.5 0 0 1-1.5-1.8l1.2-5A1.5 1.5 0 0 1 6.2 3.5h7.3V11Zm0 0h3V3.5h-3" />
  ),
  sun: (
    <>
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 2.5v1.8M10 15.7v1.8M17.5 10h-1.8M4.3 10H2.5M15.3 4.7l-1.3 1.3M6 14l-1.3 1.3M15.3 15.3 14 14M6 6 4.7 4.7" />
    </>
  ),
  moon: <path d="M16.5 11.2A6.8 6.8 0 1 1 8.8 3.5a5.3 5.3 0 0 0 7.7 7.7Z" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
