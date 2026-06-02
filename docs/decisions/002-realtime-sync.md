# ADR-002: Real-time sync — Liveblocks (direct integration)

- **Status:** Accepted
- **Date:** 2026-06-01

## Context

We need multi-user real-time sync of the canvas (storage) plus cursor presence.
The original brief specified installing `@liveblocks/react-tldraw`.

## Decision

Use **Liveblocks** for CRDT storage and presence, integrated via
`@liveblocks/client`, `@liveblocks/react`, and `@liveblocks/node` (for the
server-side auth token). Sync the tldraw store to Liveblocks storage using
tldraw's store-listener API.

**The package `@liveblocks/react-tldraw` does not exist on npm** — adding it
would break `pnpm install`. (Confirmed during the Phase 0 dependency audit.)
There is no official Liveblocks-maintained tldraw package under that name.

## Consequences

- ➕ Generous free tier (50 MAU, 1000 rooms) for a portfolio app.
- ➕ Presence + storage in one SDK; Apache-2.0 licensed.
- ➖ We own the tldraw ↔ Liveblocks glue code (store snapshot diff → storage),
  rather than getting it from a turnkey package. Phase 3 implements this.
