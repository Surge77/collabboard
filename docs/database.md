# Database

- **Engine:** PostgreSQL (Neon serverless in production).
- **ORM:** Prisma 6. Schema: [`prisma/schema.prisma`](../prisma/schema.prisma).

## Models

### Auth.js models (required by the Prisma adapter)

- `User` — id (cuid), name, email (unique), emailVerified, image, timestamps.
- `Account` — OAuth account links; unique `(provider, providerAccountId)`.
- `Session` — present for adapter compatibility (we use JWT sessions at runtime).
- `VerificationToken` — email verification tokens.

### Application models

- `Board` — id (cuid), title, `userId` (FK → User, `onDelete: Cascade`),
  `isPublic`, timestamps. Indexed on `userId`.

## Conventions

- IDs are `cuid()` — never auto-increment integers.
- Every foreign key gets an `@@index`.
- No raw SQL — Prisma parameterizes all queries.

## Workflow

```bash
pnpm db:generate     # after editing schema.prisma
pnpm db:push         # prototype: push without a migration
pnpm db:migrate      # create + apply a named migration (uses DIRECT_URL)
pnpm db:studio       # browse data
```

Never edit files under `prisma/migrations/` by hand.

## Connection strings (Neon)

- `DATABASE_URL` — pooled connection, used at runtime.
- `DIRECT_URL` — direct connection, used by `prisma migrate` (migrations cannot
  run through the pooler).
