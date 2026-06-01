# CLAUDE.md — CollabBoard

Real-time collaborative whiteboard with AI features. Read `docs/roadmap.md` for
the full phase plan and `docs/architecture.md` for the system design before
making non-trivial changes.

## Stack (authoritative — match these versions)

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript 5** (strict)
- **Tailwind CSS v4** — CSS-first config in `src/app/globals.css`. There is **no
  `tailwind.config.ts`**; use `@theme` in CSS for tokens.
- **Auth.js v5** (`next-auth@5.0.0-beta.31`) — pinned exact, do not float `@beta`.
- **Prisma 6** (not 7 — see `docs/decisions/005-prisma-6-over-7.md`) → Neon PostgreSQL.
- **Package manager: pnpm.** Never use npm or yarn here.
- Tldraw (Phase 2), Liveblocks (Phase 3), Vercel AI SDK + Gemini (Phase 4).

## Commands

```bash
pnpm dev            # dev server
pnpm lint           # next lint + eslint
pnpm type-check     # tsc --noEmit
pnpm test           # vitest run
pnpm test:coverage  # vitest with coverage
pnpm build          # production build
pnpm db:generate    # regenerate Prisma client (run after schema edits)
pnpm db:push        # push schema to the database
pnpm db:migrate     # create + apply a migration
```

Run `pnpm lint && pnpm type-check && pnpm test` before every commit.

## Never do

- Never commit directly to `main` — branch from `develop`.
- Never expose secrets to the client — only `NEXT_PUBLIC_*` vars reach the browser.
- Never use `any` — use `unknown` and narrow it.
- Never skip error handling in API routes; always check the session before any DB op.
- Never use `console.log` — only `console.warn` / `console.error`.
- Never edit files under `prisma/migrations/` or `src/generated/` by hand.
- Never import `@/lib/db` or `@/lib/auth` (Prisma adapter) into Edge code
  (`proxy.ts`) — use `@/lib/auth.config` there. Prisma is not Edge-compatible.
- Never store secrets in code or committed `.env*` — only `.env.local` + Vercel.

## Always do

- Use the `@/` import alias, never deep relative paths (`../../lib`).
- Conventional commits: `type(scope): description` (enforced by commitlint).
- Validate input at boundaries (HTTP / WS handlers) with Zod before use.
- Handle loading and error states in every component.
- New feature → new test(s). Bug fix → regression test first.
- Keep files under 300 lines; split by responsibility when they grow.

## Auth specifics (Auth.js v5)

- Env names use the `AUTH_*` convention: `AUTH_SECRET`, `AUTH_GOOGLE_ID`,
  `AUTH_GOOGLE_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`.
- Config is split: `src/lib/auth.config.ts` is Edge-safe (providers + callbacks,
  no adapter) and used by `src/proxy.ts`; `src/lib/auth.ts` adds the Prisma
  adapter and exports `handlers`, `auth`, `signIn`, `signOut`.
- Session strategy is **JWT** so the proxy can authorize at the Edge.
- Get the session in server components / route handlers with `await auth()`.

## File structure

- Components → `src/components/[domain]/` (PascalCase files, named exports).
- API routes → `src/app/api/[resource]/route.ts`.
- Shared types → `src/types/`; utilities → `src/lib/`.
- Route protection logic lives in `auth.config.ts`'s `authorized` callback.

## Database

- Prisma only — no raw SQL. Use `cuid()` IDs. Add `@@index` on every FK.
- After any `schema.prisma` change: `pnpm db:generate`, then a migration.

## Git workflow

1. `git checkout -b feat/your-feature develop`
2. Atomic commits, conventional format.
3. `pnpm lint && pnpm type-check && pnpm test` before opening a PR.
4. PR targets `develop`, not `main`.

## When stuck

- Check `docs/decisions/` for why things are the way they are.
- Mirror existing patterns in sibling files before inventing new ones.
- Ask before changing shared `src/lib/` files — they affect everything.
