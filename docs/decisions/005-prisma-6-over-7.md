# ADR-005: Prisma 6, not 7

- **Status:** Accepted
- **Date:** 2026-06-01

## Context

`@latest` installed Prisma 7. Prisma 7 removed `url`/`directUrl` from the schema
`datasource` block and now **requires a driver adapter** (e.g. `@prisma/adapter-neon`)
plus a `prisma.config.ts` for the CLI. The Auth.js Prisma adapter docs and the
broad ecosystem still assume the Prisma 6 connection model.

## Decision

Pin **Prisma 6** (`prisma` and `@prisma/client` at `6.x`). The schema keeps
`url = env("DATABASE_URL")` / `directUrl = env("DIRECT_URL")`, and `PrismaClient`
is constructed with no adapter.

## Consequences

- ➕ Stable, widely-documented connection model; works directly with Neon's
  pooled connection string and `@auth/prisma-adapter`.
- ➕ No extra driver-adapter dependency or `prisma.config.ts` to maintain.
- ➖ We are intentionally one major version behind. Revisit a Prisma 7 migration
  (adopting the Neon driver adapter) as a deliberate, isolated task later.
