# ADR-004: Framework and version choices

- **Status:** Accepted
- **Date:** 2026-06-01

## Context

The brief specified Next.js 15 and Tailwind CSS 3. `create-next-app@latest`
installed Next.js 16 and Tailwind 4.

## Decision

Adopt what `create-next-app@latest` ships: **Next.js 16, React 19, Tailwind
CSS 4**, ESLint 9 flat config, and **pnpm** as the package manager.

## Consequences

- ➕ Current, supported releases; no immediate-upgrade debt.
- ⚠️ **Tailwind 4 is CSS-first** — configuration lives in `globals.css` via
  `@import "tailwindcss"` and `@theme`. There is **no `tailwind.config.ts`**.
- ⚠️ **Next 16 renamed the `middleware` convention to `proxy`.** Route protection
  lives in `src/proxy.ts` (same API as middleware).
- ⚠️ ESLint uses the **flat config** (`eslint.config.mjs`), not `.eslintrc.json`.
- shadcn/ui supports Tailwind 4; components arrive in Phase 1.
