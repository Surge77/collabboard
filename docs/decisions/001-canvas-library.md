# ADR-001: Canvas library — tldraw

- **Status:** Accepted
- **Date:** 2026-06-01

## Context

We need an infinite canvas with drawing tools, programmatic shape insertion (for
AI-generated diagrams), and a store that can sync over a CRDT backend.

## Decision

Use **tldraw**. It provides a production-grade infinite canvas, a documented
editor API for inserting/reading shapes, built-in PNG/SVG export, and a store
designed to integrate with external sync backends.

## Consequences

- ➕ Fast path to a polished canvas; export comes for free (Phase 5).
- ➕ Editor API supports programmatic shapes (Phase 4 AI generation).
- ⚠️ **License:** tldraw ships under a **Business Source License (BSL)**, not a
  standard OSI license. It restricts building a competing commercial whiteboard.
  Fine for this portfolio project; **a legal review is required before any
  commercial use.** Read <https://github.com/tldraw/tldraw/blob/main/LICENSE.md>.
- ⚠️ Largest bundle dependency in the project — lazy-load the editor; keep it out
  of the critical path.
