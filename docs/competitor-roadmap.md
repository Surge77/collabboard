# CollabBoard Competitor Roadmap

Plan to grow CollabBoard from "phases 0-5 MVP" into a full Excalidraw / Miro /
FigJam competitor. Derived from a 5-agent analysis (competitive gap, AI strategy,
architecture, codebase map, growth/UX) run 2026-06-20.

Each phase ships through the proven `collabboard-phase-delivery` loop: own
`feat/` branch → `pnpm type-check && lint && test` + `pnpm build` gate →
mandatory `security-reviewer` where flagged → PR to `develop` → browser-verify →
promote to `main`.

**Strategic wedge:** _AI-native whiteboard — turn a sentence into a live,
editable diagram, together with your team._ Lean on AI + Liveblocks/tldraw
primitives we already pay for, not on out-building incumbents feature-for-feature.

---

## Phase 0 — Unblocks (safe, self-contained, highest ROI) — IN PROGRESS

No schema/product decisions required. Fixes two latent quality bugs and removes
the data-loss risk.

- **0a. Analyze sees shape text.** `AiPanel.analyze` sends only `{type}` per
  shape (`AiPanel.tsx:89`), so the summary AI is blind to labels. Send the
  shape's plain text too. `analyzeInputSchema` already supports `text`. Unlocks
  every "understanding" feature later.
- **0b. Graph output + deterministic auto-layout.** Stop asking Gemini for pixel
  x/y (source of the width/height hack + 16-shape cap). Model emits a graph
  (`nodes` + `edges`); a layout engine (`dagre`) computes coordinates client-side;
  client draws tldraw `geo` nodes + bound `arrow` shapes. Raises quality of every
  diagram type and adds connectors. **Adds dependency → `dependency-auditor`.**
- **0c. Yjs persistence backstop (CRITICAL).** Canvas lives only in Liveblocks
  today; room eviction/outage = permanent loss. Add a `BoardSnapshot` model +
  a Liveblocks webhook route that, on `ydocUpdated`/`roomLeft`, snapshots
  `getYjsDocumentAsBinaryUpdate` to Postgres/Blob. **Touches external API +
  access control → `security-reviewer`.**

Gate per sub-task. Branch: `feat/phase-0-unblocks` (3 commits) or split.

---

## Phase 1 — Multi-tenancy foundation (root dependency for everything multi-user)

The binary `Board.userId` owner / public-viewer model is load-bearing across the
DB, `getViewableBoard`, the Liveblocks auth route, and the board page. Teams,
roles, comments, sharing all block on replacing it.

- **1a. Schema:** `Organization`, `OrganizationMember(role)`, `Folder`,
  `BoardMember(role)`; `Board` gains `orgId`, `folderId?`, `createdById`,
  `thumbnailUrl?`, `lastActivityAt`, `archivedAt?`, `deletedAt?`. `@@index` on
  every FK + composite indexes for hot queries. Data migration: personal org per
  existing user, keep `userId`→`createdById`.
- **1b. `src/lib/authz.ts`** — single `resolveBoardAccess(boardId, userId)`
  returning a role (`admin|editor|commenter|viewer`) or null, with precedence
  `BoardMember → org role → ShareLink → null`. Replaces `getViewableBoard`.
- **1c. `ShareLink`** (token, role, expiresAt?, revoked) replacing the
  `isPublic` boolean — unguessable expiring links with per-link role.
- **1d.** Map roles → Liveblocks token access in `liveblocks-auth`; widen the
  `canEdit: boolean` prop to a `BoardRole` enum end-to-end (page → Room →
  CollabCanvas → useYjsStore). Re-gate the admin-key duplicate path through
  `resolveBoardAccess`.

**`security-reviewer` mandatory** (1b, 1c, 1d). Largest refactor; do before
Phase 2.

---

## Phase 2 — Cheap parity (surface primitives we already pay for)

- **2a. Comments / threads** — Liveblocks Comments (drop-in) or Postgres
  `Comment` model anchored to shape/coords, rendered as a canvas overlay.
- **2b. Sticky notes + frames in toolbar** — tldraw ships both natively; expose
  them (toolbar slot override in `CollabCanvas.tsx`).
- **2c. Facilitation kit** — voting, timer, reactions/emotes, cursor chat via
  Liveblocks storage/broadcast (cheap, unlocks workshop use-case).
- **2d. Version history / restore** — built on `BoardSnapshot` (0c) +
  `liveblocks.listYjsDocumentVersions`.

No `security-reviewer` unless an endpoint handles new user input → persist.

---

## Phase 3 — AI moat (the differentiation budget)

- **3a. Diagram templates** — flowchart / mind map / org chart first (shared
  node+edge model from 0b), then ERD / wireframe.
- **3b. AI as a live in-room participant (flagship)** — `@mention` → `/api/ai/agent`
  → plan → author canvas edits server-side via `sendYjsBinaryUpdate` (reuses the
  `copyBoardCanvas` mechanism + existing Yjs sync path). AI gets a Liveblocks
  presence cursor. Safe-by-construction: AI creates new ids only, deletes only
  its own (tagged via shape meta). `getOrCreateRoom` before any server write.
- **3c. "Clean up / auto-align my mess"** — transform-based, one undo step.
- **3d. Extract action items & decisions** — `generateObject` over board text
  (built on 0a) → checklist frame.
- **Cross-cutting:** Vercel AI Gateway (provider fallback, spend caps, obs) +
  AI-shape provenance meta tag (enables undo-AI / accept-reject).

**`security-reviewer` mandatory** (3b — untrusted mention → LLM → canvas write).

---

## Phase 4 — Growth + monetization (needs product decisions)

- **4a. Guest-editable share links** — draw before signup; prompt auth only to
  save/own. Kills the #1 growth leak (OAuth wall).
- **4b. "Made with CollabBoard" watermark** on free exports/public boards;
  removal is a paid perk.
- **4c. Credit-metered AI billing** — gate on AI cost, never on collaboration.
  150 free credits/mo, weighted per action, hard cap every tier, balance in UI.
  **BLOCKED on a product decision: payment provider (Stripe?) + tier prices.**
- **4d. Onboarding** — kill the empty dashboard; AI-first first-run
  ("Describe what you want to draw…"); sample board; SEO template gallery.

---

## Cross-cutting (slot in as phases land)

- **Vercel Blob asset store** — kill base64-image-in-Yjs bloat (blocks scale).
- **Split `useYjsStore.ts`** (287 lines) into `useYjsDocumentSync` /
  `useYjsPresence` before adding to it.
- **Tests** — `src/` currently has near-zero tests despite Vitest configured;
  add coverage as each touched path is built (80% on new code per rules).
- **Page-partitioned Yjs + awareness throttle** — the 10k-shape / 50-user scaling
  work; defer until boards get large.

---

## Top architectural risks (from the architecture pass)

1. Canvas persists only in Liveblocks — data loss. → Phase 0c.
2. Binary owner/public model blocks the whole roadmap. → Phase 1.
3. Unbounded, fully-client-loaded Yjs doc + base64 images → OOM at scale.
   → Blob asset store + page partitioning.
4. Permanent guessable board-cuid share link, no expiry/revoke/role. → Phase 1c.
5. Admin-key canvas copy bypasses Liveblocks ACL. → re-gate in Phase 1d.
