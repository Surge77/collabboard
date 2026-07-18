# CollabBoard — Session Progress & Handoff

_Last updated: 2026-07-06. Working through `docs/competitor-roadmap.md` via the
`collabboard-phase-delivery` loop (branch → gate → security-review where flagged
→ PR to `develop` → merge)._

## Shipped this session (merged to `develop`)

| PR | What |
|----|------|
| #30 | `chore/repo-hygiene` — removed committed `bash.exe.stackdump`, ignore rules for `*.stackdump`, `.playwright-mcp/`, root `/*.png` |
| #31 | **tldraw made the canonical canvas** (was Excalidraw on `develop`). Ported the two-client sync E2E to tldraw. Fixed the long-red CI `e2e` job (global-setup now skips seeding when `DATABASE_URL`/`AUTH_SECRET` absent). |
| #32 | **Phase 1 — multi-tenancy.** `Organization`, `OrganizationMember(OrgRole)`, `Folder`, `BoardMember(BoardMemberRole)`; `Board` gained `createdById`/`orgId`/`folderId`/`thumbnailUrl`/`lastActivityAt`/`archivedAt`/`deletedAt`. Unified role `admin\|editor\|commenter\|viewer` in `resolveBoardAccess` (creator → BoardMember → org role → share token → public → null). All board routes re-gated; role flows page→Canvas→Room→CollabCanvas. security-review PASS (1 MEDIUM fixed in-branch). |
| #33 | `refactor/split-yjs-store` — split `useYjsStore` (287 lines) into `yjsDocumentSync.ts` + `yjsPresence.ts` + 89-line hook. Behavior-preserving, sync E2E 3/3. |
| #34 | **Phase 2d — version history.** Additive `BoardVersion` table (append-only). `saveVersion`/`listVersions`/`restoreVersion` in `src/lib/board-versions.ts`. Restore reconciles the CRDT via `computeReconcileUpdate` (seed live state → transform to target → send diff) — proven by 5 unit tests over real Yjs docs AND a live Liveblocks round-trip diag. Routes editor-gated + rate-limited. `VersionHistory.tsx` panel. security-review PASS (its MEDIUM = missing rate limit, fixed in-branch). |

Latest `develop` HEAD at handoff: `fa0b39f` (Merge PR #34).

| #35 | **Phase 2a/2b — comments + stickies.** Self-contained Postgres comments: anchored pins, one-level threaded replies, resolve, delete; realtime via `comments-changed` broadcast → refetch. 2b (sticky/frame) satisfied by default tldraw tools. security-review PASS (2 MEDIUM fixed in-branch: rate-limit on PATCH/DELETE + cuid guard on `commentId`). |
| #36 | **Phase 2c — facilitation kit.** Ephemeral broadcast-only timer (shared countdown, editor-gated control), cursor chat (`/` at cursor, 5s bubbles), live vote/temperature-check. `src/lib/facilitation.ts` pure guards + helpers, all in `RoomEvent` union. No DB/endpoint → no security review. 224 tests. |
| #37 | **Phase 3 — AI moat (3a).** Diagram templates (flowchart/mindmap/orgchart, deterministic via dagre), extract action items (`/api/ai/actions`, bounded string-array schema, security-review PASS), canvas tidy (grid-snap). All on the client-applies-shapes flow (no server Yjs). Extracted `ai-canvas.ts`. 238 tests. |
| #38 | **Phase 4 — growth.** "Made with CollabBoard" export watermark (PNG canvas / SVG inject / PDF text; pure geometry + SVG helpers tested). AI-first onboarding empty-state. Guest-editable share links already shipped in Phase 1 (ShareRole EDITOR end-to-end). Billing 4c skipped. 243 tests. |

| #39 | **Phase 3b — live AI participant.** `/api/ai/agent` generates a diagram and writes it server-side into the live Yjs canvas for every collaborator (`ai-agent.ts` reuses board-versions getOrCreateRoom→read→find page→add records→send diff). Records built tldraw-free (`ai-agent-shapes.ts`), validated against real tldraw schema via `createTLStore().put()` in jsdom; live-Liveblocks round-trip diag PASS. "Draw live for everyone" checkbox in AiPanel. security-review PASS (MEDIUM tighter 5/min budget + LOW error-log fixed in-branch). 254 tests. |

Latest `develop` HEAD: `ecfbf3a` (Merge PR #39). **ROADMAP COMPLETE** (billing 4c skipped).

## Owed on Phase 3b: browser render-verify
Yjs write is proven (schema-gate unit test + live Liveblocks round-trip diag),
but tldraw *rendering* the server-written shapes needs a real browser: check
"Draw live for everyone", Generate, confirm the diagram renders on-canvas and
appears in a second tab.

## Browser-verify owed (all merged phases — needs manual OAuth login)

Two tabs on the Vercel preview: comments (pin/reply/resolve/delete, track
pan/zoom, live); facilitation (timer both tabs, `/` cursor chat, vote tally);
AI (templates, generate, extract action items, tidy); export watermark on
PNG/SVG/PDF; onboarding empty-state; EDITOR share link lets a 2nd account edit.

## DONE — Phase 2a/2b (PR #35, auto-merge armed)

**2b (sticky notes + frames): already satisfied by default tldraw** — the note
and frame tools ship in the default `<Tldraw>` toolbar and `CollabCanvas` only
overrides `StylePanel`, so no code needed. Confirm in browser-verify and note in
the PR.

**2a (comments/threads): built, gate not yet passed.** Self-contained Postgres
approach (NOT `@liveblocks/react-comments` — the pinned node SDK also lacks
`listYjsDocumentVersions`, and adding the Comments product = dep + plan
dependency). Anchored canvas comment pins + one level of threaded replies +
resolve + delete; realtime via a `comments-changed` broadcast → refetch.

### Files created/modified on the branch (uncommitted)
- `prisma/schema.prisma` — new `Comment` model (self-relation replies, `x`/`y`
  anchor, `resolved`, `parentId`); `Board.comments` + `User.comments` back-refs.
- `prisma/migrations/20260706003747_add_comment/migration.sql` — **already
  applied to Neon** (additive CREATE TABLE, migrate deploy succeeded).
- `src/lib/comments.ts` — `listThreads` (2 queries + in-memory group),
  `createComment` (root or reply; validates parent same-board & is-root),
  `setCommentResolved`, `deleteComment(allowAnyAuthor)`.
- `src/lib/validations/comment.ts` — `createCommentSchema` (refine: x+y XOR
  parentId), `updateCommentSchema`.
- `src/lib/comment-events.ts` — `CommentsChangedEvent` + guard.
- `src/app/api/boards/[id]/comments/route.ts` — GET (any role), POST
  (commenter+, rate-limited, 422/404/429).
- `src/app/api/boards/[id]/comments/[commentId]/route.ts` — PATCH resolve
  (commenter+), DELETE (author, or admin via `allowAnyAuthor`).
- `src/components/board/useComments.ts` — data hook (fetch + broadcast refetch +
  4 mutations).
- `src/components/board/CommentThread.tsx` — thread popover (replies, compose,
  resolve, delete).
- `src/components/board/Comments.tsx` — `track()`-wrapped overlay; pins via
  `editor.pageToViewport`, comment-mode click-catcher via `editor.screenToPage`.
- `src/components/board/CollabCanvas.tsx` — renders `<Comments>`.
- `src/types/liveblocks.d.ts` — `RoomEvent` union now includes
  `CommentsChangedEvent`.
- `tests/integration/api/comments.test.ts` — route tests (gating, validation,
  rate limit, admin-vs-author delete).

### NEXT STEPS to finish 2a/2b (resume here)
1. **Run the gate** — was interrupted right before:
   `pnpm lint && pnpm type-check && pnpm test`. type-check + lint were passing
   after the two fixes below; just needs the full run confirmed.
   - Fixes already applied this session: added `CommentsChangedEvent` to the
     `RoomEvent` union (TS2322), and an `eslint-disable-next-line
     react-hooks/set-state-in-effect` on the initial fetch in `useComments.ts`
     (setState is async inside the fetch promise — same justified pattern as
     `useYjsStore`).
2. `pnpm build`.
3. **security-reviewer** (mandatory — new user-input→persist endpoints):
   check comment authorization (viewer can't post; author-or-admin delete;
   cross-board IDOR on `commentId`/`parentId` — both are board-scoped in the
   lib), rate limiting (present, 30/min), body length cap (2000, Zod), XSS
   (React auto-escapes `body`; no `dangerouslySetInnerHTML`).
4. **Browser-verify**: two tabs — place a comment pin, reply, resolve, delete;
   confirm pins track pan/zoom and appear live in the other tab. Also confirm
   the tldraw note + frame tools are present (2b).
5. Commit (conventional), PR → `develop`, watch CI, `--auto` merge, sync develop.
6. Mark task #3 done; move to #5.

## Remaining roadmap (task list)
- **#5 Phase 2c** — facilitation kit: voting, timer, cursor chat (reactions
  already shipped). Liveblocks storage/broadcast.
- **#6 Phase 3** — AI moat: diagram templates (flowchart/mind map/org chart),
  **live AI participant** (`@mention` → `/api/ai/agent` → server-side canvas
  edits via `sendYjsBinaryUpdate` + AI presence cursor; provenance meta tag;
  security-review MANDATORY), auto-cleanup/align, extract action items. The
  flagship interview feature.
- **#7 Phase 4 (no billing)** — guest-editable share links, "Made with
  CollabBoard" export watermark, onboarding (AI-first first-run, sample board).
  Billing (4c) SKIPPED per owner decision.

## Standing decisions & hazards
- **tldraw is canonical**; Excalidraw variant parked in `src/components/board/excalidraw/` (unwired). Billing 4c skipped.
- **PRISMA SHADOW-DB HAZARD (caused a data loss this session):** never pass a
  real DB URL to `--shadow-database-url` / `migrate diff` — it WIPES that DB.
  The Neon dev DB was wiped 2026-07-05 (22 boards); owner chose to continue on
  empty DB. Generate migration SQL by hand + `migrate deploy`; migration history
  was baselined (`0_init`..share-link marked applied). See global memory
  `prisma-shadow-db-never-real`.
- Migrations must be hand-written additive SQL and applied with `migrate deploy`
  (set `DATABASE_URL`/`DIRECT_URL` from `.env.local` into the shell first —
  Prisma CLI reads `.env`, not `.env.local`).
- Neon cold-starts: first DB hit after idle can time out (~one retry fixes it).
  Seen in E2E global-setup.
- `set -o pipefail` before `pnpm ... | tail` — a bare pipe masks a failing exit
  code (bit me on an E2E run that looked green but had errored).
- Two live Vercel deployments (tldraw + excalidraw variants) both build on PRs.
- Security-review sessions have repeatedly reported injected/fake instruction
  blocks in their context (fake MCP-tool directives, a fake "don't tell the
  user" line). Both reviewers ignored them. Worth investigating which
  plugin/MCP is injecting.
