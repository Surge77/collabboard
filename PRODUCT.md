# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: small remote product and engineering teams who brainstorm, diagram and
run quick syncs together in real time on a shared canvas (the job Miro, FigJam
and tldraw.com users do). Secondary: recruiters and reviewers evaluating the
project in a short demo. The demo must impress, but never at the cost of a real
tool's ergonomics — teams come first.

## Product Purpose

A real-time collaborative whiteboard where a team can turn a sentence into a
live, editable diagram together. Success: a team opens a board, gets from idea
to a shared diagram in minutes, and keeps editing it together.

## Positioning

AI-native whiteboard. The differentiator is AI that generates and edits
diagrams live for the whole room (prompt → editable tldraw shapes, canvas
analysis, action items, tidy-up, and an AI participant that draws for everyone).
Collaboration, comments, facilitation and export support that wedge; they are
not the identity.

## Operating Context

- Boards are opened from a dashboard list and shared by link with Viewer or
  Editor access; collaborators may arrive signed out via an invite link.
- Sessions are live: multiple cursors, presence avatars, cursor chat, comments
  pinned to the canvas, version history with restore, facilitation timer, vote
  and emoji reactions.
- Outputs leave the tool as PNG / SVG / PDF exports.

## Capabilities and Constraints

- Stack: Next.js 16 App Router, React 19, Tailwind v4 (`@theme` tokens in
  `src/app/globals.css`), tldraw canvas, Liveblocks + Yjs, Vercel AI SDK +
  Gemini, Auth.js v5 (Google + GitHub OAuth), Prisma 6 on Neon.
- tldraw owns the canvas and its own UI (menu, toolbar, style panel, help).
  App controls must integrate with tldraw's UI slots rather than float over it.
- tldraw free tier renders a "made with tldraw" watermark; licensing is out of
  scope for design work.
- Billing does not exist; never imply pricing tiers or a free plan.
- An Excalidraw variant lives on a separate branch; this codebase is the tldraw
  build.

## Brand Commitments

- Name: **CollabBoard** (binding).
- Wordmark: the tiny-whiteboard mark idea is binding; it may be redrawn in a
  new style.
- The owner has rejected the recurring AI "house style" (editorial serif
  mastheads, ivory paper texture, mono small-caps labels, staggered reveals) and
  wants the product to read as a professional tool of its category.

## Evidence on Hand

- Live deployment: https://collaborative-whiteboard-ai.vercel.app
- No testimonials, customer logos, usage numbers, or benchmarks exist. Do not
  fabricate any.

## Product Principles

1. The canvas is the product; chrome earns its pixels or gets out of the way.
2. AI is a collaborator in the room, not a sidebar gimmick.
3. Shared actions are safe: anything that changes the board for everyone is
   confirmable or undoable.
4. Invited people land exactly where they were invited.
5. Works for keyboard, screen-reader and touch users, in light and dark.

## Accessibility & Inclusion

WCAG 2.2 AA: text contrast ≥ 4.5:1, field boundaries ≥ 3:1, full keyboard
operation of app controls, 44px touch targets, honor `prefers-reduced-motion`.
