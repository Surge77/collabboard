# Deployment (Vercel)

## One-time setup

1. Push the repo to GitHub (done).
2. In Vercel, **Add New → Project** and import `Surge77/collabboard`.
3. Framework preset: **Next.js** (auto-detected). Build command and output are
   detected automatically.

## Environment variables

Add these in **Vercel → Project → Settings → Environment Variables** (Production
and Preview):

```
AUTH_SECRET
AUTH_URL                 # your production URL, e.g. https://collabboard.vercel.app
AUTH_TRUST_HOST=true
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
AUTH_GITHUB_ID
AUTH_GITHUB_SECRET
DATABASE_URL             # Neon pooled
DIRECT_URL               # Neon direct
LIVEBLOCKS_SECRET_KEY            # Phase 3
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY  # Phase 3
GOOGLE_GENERATIVE_AI_API_KEY    # Phase 4
NEXT_PUBLIC_APP_URL
```

## OAuth callback URLs (production)

Add the production callbacks in the Google and GitHub OAuth apps:

- `https://<your-domain>/api/auth/callback/google`
- `https://<your-domain>/api/auth/callback/github`

## Database migrations

Run migrations against the production DB before/at deploy:

```bash
DATABASE_URL=... DIRECT_URL=... pnpm prisma migrate deploy
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs lint, type-check, test, and
build on every PR and on pushes to `main`/`develop`. Vercel builds previews per
PR automatically once the project is linked.
