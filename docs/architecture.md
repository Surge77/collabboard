# Architecture

## System diagram

```
Browser (tldraw canvas + React)
    │
    ├── Liveblocks SDK (WebSocket) ──► Liveblocks Cloud (CRDT sync, presence)   [Phase 3]
    │
    └── Next.js 16 App (Server Components + Route Handlers)
            │
            ├── Auth.js v5 ───────────► Google / GitHub OAuth
            │
            ├── Prisma 6 ─────────────► Neon PostgreSQL
            │
            └── Vercel AI SDK ────────► Google Gemini API                       [Phase 4]
```

## Auth: edge/server split

Prisma is not Edge-runtime compatible, but route protection runs in the Edge
`proxy`. So the Auth.js config is split:

- **`src/lib/auth.config.ts`** — Edge-safe. Providers + `authorized`, `jwt`,
  `session` callbacks. No adapter. Imported by `src/proxy.ts`.
- **`src/lib/auth.ts`** — Node runtime. Spreads `authConfig`, adds
  `PrismaAdapter(db)`, sets `session.strategy = 'jwt'`, and exports `handlers`,
  `auth`, `signIn`, `signOut`.

JWT sessions let the proxy authorize requests at the Edge without a database
round-trip, while the adapter still persists users and OAuth accounts.

## Request flow: protected page

1. Request hits `src/proxy.ts` (Edge). `authorized` checks the JWT.
2. Unauthenticated requests to `/dashboard` or `/board/*` redirect to `/login`.
3. The server component calls `await auth()` for the session and renders.

## Request flow: AI generate (Phase 4)

1. User submits a prompt in the AI panel.
2. Client `POST`s to `/api/ai/generate` with prompt + canvas snapshot.
3. The route validates the session, validates input with Zod, and streams from
   Gemini via the Vercel AI SDK.
4. The client parses streamed shape JSON and inserts shapes into the tldraw editor.

## Directories

```
src/
  app/                 # App Router: pages, layouts, route handlers
    (auth)/login/      # route group — login
    (dashboard)/       # route group — dashboard
    api/               # route handlers
  lib/                 # db, auth, env, utils — shared server logic
  types/               # shared TypeScript types + module augmentation
  components/          # UI by domain (added from Phase 1)
  proxy.ts             # Edge route protection (Next 16 convention)
prisma/                # schema + seed
tests/                 # unit / integration / e2e
docs/                  # this documentation + ADRs
```
