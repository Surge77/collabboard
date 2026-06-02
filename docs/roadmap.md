# CollabBoard — Roadmap & Phase Plan

This is the working plan, refined from the original project brief. Where the
brief and reality diverged, the reasons are recorded in [`decisions/`](./decisions/).

## Changes from the original brief

| Brief said              | We shipped                | Why                                                            |
| ----------------------- | ------------------------- | -------------------------------------------------------------- |
| Next.js 15, Tailwind 3  | Next.js 16, Tailwind 4    | `create-next-app@latest`; newer + supported. [ADR-004](./decisions/004-framework-and-versions.md) |
| Prisma 5.x              | Prisma 6.x                | Prisma 7 forces driver adapters; 6 is stable. [ADR-005](./decisions/005-prisma-6-over-7.md) |
| `getServerSession()`    | `auth()` (v5)             | v5 API; split edge/server config. [ADR-006](./decisions/006-nextauth-v5-edge-split.md) |
| Schema = User + Board   | + Account/Session/VerificationToken | Auth.js Prisma adapter requires them.                |
| `.eslintrc.json`        | flat `eslint.config.mjs`  | Next 16 / ESLint 9 default.                                    |
| `@liveblocks/react-tldraw` | tldraw + `@liveblocks/react` | That package does not exist on npm. [ADR-002](./decisions/002-realtime-sync.md) |
| `NEXTAUTH_*` / `GOOGLE_CLIENT_ID` | `AUTH_*` convention | Auth.js v5 env naming.                                |
| npm                     | pnpm                      | Faster, stricter, matches lockfile.                            |

## Phase 0 — Foundation ✅

Repo, tooling, auth, database, CI. **Delivered:**

- Next.js 16 + TS strict + Tailwind 4 scaffold.
- Auth.js v5 (Google + GitHub), edge-safe split config, JWT sessions.
- Prisma 6 schema (Auth.js models + `Board`) for Neon.
- Landing, login, protected dashboard with sign-out.
- ESLint/Prettier/EditorConfig, Vitest, Playwright, Husky + lint-staged + commitlint.
- GitHub Actions CI (lint, type-check, test+coverage, build).
- Docs + ADRs.

**Runtime prerequisites the owner must supply:** Neon `DATABASE_URL`, OAuth app
credentials, `AUTH_SECRET`. See [local-setup](./local-setup.md).

## Phase 1 — Dashboard & board management

- `Board` CRUD API (`GET`/`POST /api/boards`, `GET`/`PATCH`/`DELETE /api/boards/[id]`).
- Dashboard listing, `BoardCard`, create + inline rename + delete.
- shadcn/ui base components; optimistic updates.
- Integration tests for board routes; unit tests for components.

## Phase 2 — Canvas with tldraw

- `board/[id]` route, `Canvas.tsx` wrapper, branded toolbar.
- Load/not-found/loading states. **Read the tldraw BSL license first**
  ([ADR-001](./decisions/001-canvas-library.md)).

## Phase 3 — Real-time collaboration

- Liveblocks room provider + `POST /api/liveblocks-auth`.
- tldraw ↔ Liveblocks store sync (via `@liveblocks/react`, **not** a tldraw-specific
  package), live cursors, avatar stack, reconnection handling.

## Phase 4 — AI features

- Vercel AI SDK + Gemini. `POST /api/ai/generate` (text → shapes),
  `POST /api/ai/analyze` (canvas → summary). Streaming, rate limiting, Zod input
  validation. Note current AI SDK uses `maxOutputTokens` (not `maxTokens`).

## Phase 5 — Sharing & export

- Public board access, share modal, PNG/PDF export (tldraw built-ins).

## Phase 6 — Polish, testing & launch

- Playwright E2E, error boundaries, skeletons, toasts, SEO, Lighthouse > 90,
  security pass, `v1.0.0` release.

## Cost ceiling

All chosen services have free tiers sufficient for a portfolio deployment — target
$0/month (Vercel Hobby, Neon free, Liveblocks free, Gemini free tier, GitHub).
