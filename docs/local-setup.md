# Local Development Setup

## Prerequisites

- Node.js 20+
- pnpm 9+ — `corepack enable`
- A PostgreSQL database (Neon free tier recommended)

## 1. Install

```bash
pnpm install
```

## 2. Environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable                         | Where to get it                                              |
| -------------------------------- | ------------------------------------------------------------ |
| `AUTH_SECRET`                    | `npx auth secret` (or `openssl rand -base64 32`)             |
| `AUTH_GOOGLE_ID` / `_SECRET`     | Google Cloud Console → Credentials → OAuth client ID         |
| `AUTH_GITHUB_ID` / `_SECRET`     | GitHub → Settings → Developer settings → OAuth Apps          |
| `DATABASE_URL`                   | Neon dashboard (pooled connection string)                    |
| `DIRECT_URL`                     | Neon (direct, non-pooled) — used by `prisma migrate`         |

### OAuth redirect URIs (local)

- Google: `http://localhost:3000/api/auth/callback/google`
- GitHub: `http://localhost:3000/api/auth/callback/github`

## 3. Database

```bash
pnpm db:generate     # generate the Prisma client
pnpm db:push         # push schema to your database
pnpm db:seed         # optional: sample data
```

## 4. Run

```bash
pnpm dev             # http://localhost:3000
```

## Verify the toolchain

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
```

## Troubleshooting

- **Auth redirect loop** — `AUTH_URL` must match your local origin; set
  `AUTH_TRUST_HOST=true` locally.
- **`PrismaClientInitializationError`** — `DATABASE_URL` missing or unreachable.
- **Type errors referencing `@prisma/client`** — run `pnpm db:generate`.
- **Edge runtime error mentioning Prisma** — you imported `@/lib/db` or
  `@/lib/auth` into `proxy.ts`. Use `@/lib/auth.config` there instead.
