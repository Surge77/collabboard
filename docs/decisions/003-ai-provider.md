# ADR-003: AI provider — Google Gemini via Vercel AI SDK

- **Status:** Accepted
- **Date:** 2026-06-01

## Context

We need streaming text generation for two features: text → diagram (shapes) and
canvas → summary. The app is Next.js-native and must stay on a free tier.

## Decision

Use the **Vercel AI SDK** (`ai` + `@ai-sdk/google`) with **Google Gemini**
(`gemini-1.5-flash` or newer flash model). The AI SDK gives streaming, a
provider-agnostic interface (swap providers later), and first-class Next.js
route-handler support.

## Consequences

- ➕ Generous Gemini free tier; Apache-2.0 SDK; provider-swappable.
- ⚠️ API note: the current AI SDK uses **`maxOutputTokens`** (not `maxTokens`)
  and the streaming response helper API differs from older 4.x examples in the
  original brief. Phase 4 code must match the installed SDK version.
- ⚠️ Rate limits on the free tier — Phase 4 adds server-side rate limiting and
  graceful error messages.
