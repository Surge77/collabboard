# ADR-006: Auth.js v5 with an edge/server config split

- **Status:** Accepted
- **Date:** 2026-06-01

## Context

The brief used the NextAuth v4 API (`getServerSession(authOptions)`). We use
**Auth.js v5** (`next-auth@5.0.0-beta.31`), whose API is `auth()` / `handlers` /
`signIn` / `signOut`. Route protection runs in the Edge `proxy`, but the Prisma
adapter cannot run on the Edge runtime.

## Decision

Split the configuration:

- **`src/lib/auth.config.ts`** — Edge-safe: providers + `authorized`/`jwt`/
  `session` callbacks, `pages`. No adapter. Imported by `src/proxy.ts`.
- **`src/lib/auth.ts`** — Node: spreads `authConfig`, adds `PrismaAdapter(db)`,
  sets `session.strategy = 'jwt'`, exports `handlers`, `auth`, `signIn`, `signOut`.

Use **JWT sessions** so the proxy authorizes at the Edge with no DB call, while
the adapter still persists users and OAuth accounts.

Pin `next-auth` to the **exact** beta version (not `@beta`) so installs are
reproducible. Env vars follow the v5 `AUTH_*` convention.

## Consequences

- ➕ Edge route protection works without bundling Prisma into the Edge runtime.
- ➕ Reproducible installs; users + accounts still persisted to Postgres.
- ➖ Two config files to keep in sync; the adapter is the only delta between them.
- ⚠️ Beta dependency — watch the Auth.js changelog when bumping.
