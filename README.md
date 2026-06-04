<div align="center">

# 🎨 CollabBoard

**Real-time collaborative whiteboard with an AI copilot.**

Draw together on an infinite canvas, generate diagrams from a text prompt,
summarize what's on the board, and collaborate with live cursors.

[![CI](https://github.com/Surge77/collabboard/actions/workflows/ci.yml/badge.svg)](https://github.com/Surge77/collabboard/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**Live demos:** [tldraw build](https://collaborative-whiteboard-ai.vercel.app) ·
[Excalidraw build](https://collabboard-excalidraw.vercel.app)

</div>

---

## Live deployments

CollabBoard ships in **two canvas variants**, each deployed independently on
Vercel from this repo. They share the same auth, database, Liveblocks real-time
layer, and AI features — only the canvas engine differs.

| Variant | Canvas | Live URL | Branch | Vercel project |
| ------- | ------ | -------- | ------ | -------------- |
| **tldraw** _(original)_ | [tldraw](https://tldraw.dev) (BSL) | <https://collaborative-whiteboard-ai.vercel.app> | `main` / `develop` | `collaborative-whiteboard-ai` |
| **Excalidraw** _(MIT, no watermark)_ | [Excalidraw](https://github.com/excalidraw/excalidraw) | <https://collabboard-excalidraw.vercel.app> | `spike/excalidraw-v2` | `collabboard-excalidraw` |

The Excalidraw variant exists because tldraw's Business Source License restricts
commercial whiteboard products and its free tier renders a watermark — Excalidraw
is MIT with neither limitation. Each variant's production branch auto-deploys its
own Vercel project on push. See [`docs/deployment.md`](./docs/deployment.md).

## Features

- ♾️ Infinite canvas with multi-user real-time collaboration
- 👥 Live cursor presence — see where everyone is
- ✏️ Drawing tools: pen, shapes, text, sticky notes, arrows
- 🤖 AI: generate diagrams from a text prompt
- 🧠 AI: analyze and summarize the canvas
- 🔗 Room-based sessions with shareable links
- 🔐 OAuth authentication and persistent boards
- 📤 Export to PNG / PDF

## Tech stack

| Layer        | Choice                                   |
| ------------ | ---------------------------------------- |
| Framework    | Next.js 16 (App Router) · React 19       |
| Language     | TypeScript 5 (strict)                    |
| Styling      | Tailwind CSS v4                          |
| Auth         | Auth.js v5 (Google + GitHub OAuth)       |
| Database     | Neon PostgreSQL + Prisma 6               |
| Canvas       | tldraw                                   |
| Real-time    | Liveblocks (CRDT, presence, storage)     |
| AI           | Vercel AI SDK + Google Gemini            |
| Testing      | Vitest + Playwright                      |
| Deployment   | Vercel                                   |

## Quick start

```bash
pnpm install
cp .env.example .env.local   # then fill in the values
pnpm db:generate
pnpm db:push                 # requires a DATABASE_URL
pnpm dev                     # http://localhost:3000
```

Full instructions: [`docs/local-setup.md`](./docs/local-setup.md).

## Documentation

- [Architecture](./docs/architecture.md)
- [Local setup](./docs/local-setup.md)
- [API reference](./docs/api.md)
- [Database](./docs/database.md)
- [Deployment](./docs/deployment.md)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). All commits follow
[Conventional Commits](https://www.conventionalcommits.org/) and must pass
lint, type-check, and tests.

## Licensing note

This project's own code is MIT (see [LICENSE](./LICENSE)). It depends on
[**tldraw**](https://github.com/tldraw/tldraw/blob/main/LICENSE.md), which ships
under a **Business Source License** restricting commercial whiteboard products.
That is fine for this portfolio project; review tldraw's license before any
commercial use. For an MIT, watermark-free alternative, see the **Excalidraw
variant** on branch [`spike/excalidraw-v2`](https://github.com/Surge77/collabboard/tree/spike/excalidraw-v2)
(live at <https://collabboard-excalidraw.vercel.app>).
