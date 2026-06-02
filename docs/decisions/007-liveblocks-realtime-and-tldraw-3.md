# ADR-007 — Realtime via Liveblocks + Yjs, tldraw pinned to 3.15.6

## Status

Accepted (Phase 3).

## Context

Phase 3 adds real-time multiplayer to the tldraw canvas: shared document,
live cursors/presence, avatars. Two sub-decisions were forced during implementation.

### 1. Sync transport

- **Liveblocks + Yjs** (`@liveblocks/yjs` bridging a `Y.Doc` to tldraw's `Store`)
  is hosted, has a free tier, and the keys were already provisioned. Fits the
  Vercel / $0 target.
- **tldraw's own `@tldraw/sync`** (native, lock-step with tldraw 5.x) requires a
  self-hosted WebSocket server (Cloudflare Durable Objects or a separate
  service) — does not fit Vercel / $0.

Chosen: **Liveblocks + Yjs**, per [ADR-002](./002-realtime-sync.md).

### 2. tldraw version

Phase 2 shipped **tldraw 5.0.1** (npm `latest`). But the maintained Liveblocks
tldraw example and the whole community Yjs-binding ecosystem target **tldraw
3.x**. tldraw 5.x changed the presence API (`createPresenceStateDerivation`
signature, stricter `TLUser`), so the proven binding does not compile against
5.x and there is **no reference implementation** for tldraw 5.x + Liveblocks-Yjs.

`tldraw@3.15.6` (latest 3.x) supports React 19 + Next 16
(`react: "^18.2.0 || ^19.0.0"`). Phase 2 only used `<Tldraw persistenceKey
licenseKey>`, all present in 3.x, so the downgrade is low-risk.

Chosen: **downgrade to `tldraw@3.15.6`** to match the proven binding rather than
hand-adapt an unproven 5.x integration.

## Decision

- Packages (pinned exact): `@liveblocks/client`, `@liveblocks/react`,
  `@liveblocks/yjs`, `@liveblocks/node` `@3.19.3`; `yjs@13.6.31`;
  `y-utility@0.1.4` (`YKeyValue`); `tldraw@3.15.6`.
- `useYjsStore` (ported from the official Liveblocks example) is the Y.Doc ↔
  tldraw Store binding — there is no `y-tldraw` package; the binding is owned here.
- `/api/liveblocks-auth` authenticates via `auth()` and authorizes a user for a
  room only after `getBoard(id, userId)` confirms ownership — realtime access can
  never exceed REST access.
- Room id: `collabboard:board:<boardId>`.

## Consequences

- Local IndexedDB persistence from Phase 2 is replaced by the shared Liveblocks
  store (offline state still cached by `@liveblocks/yjs` via `y-indexeddb`).
- Bundle grows ~90 KB gzipped for the realtime layer — acceptable, lazy-loaded
  behind the `ssr:false` canvas boundary.
- Pinned to tldraw 3.x: a future move to tldraw 5.x requires either a 5.x-ready
  Liveblocks binding or switching to `@tldraw/sync` with self-hosted infra.
- The binding is hand-owned code; tldraw/Liveblocks upgrades need a re-test of
  document + presence sync.
