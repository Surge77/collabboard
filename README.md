<div align="center">

# 🎨 CollabBoard

**Real-time collaborative whiteboard with an AI copilot.**

Draw together on an infinite canvas, generate diagrams from a text prompt,
summarize what's on the board, and collaborate with live cursors.

[![CI](https://github.com/Surge77/collabboard/actions/workflows/ci.yml/badge.svg)](https://github.com/Surge77/collabboard/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

</div>

---

## Features

- ♾️ Infinite canvas with multi-user real-time collaboration
- 👥 Live cursor presence — see where everyone is
- ✏️ Drawing tools: pen, shapes, text, sticky notes, arrows
- 🤖 AI: generate diagrams from a text prompt
- 🧠 AI: analyze and summarize the canvas
- 🔗 Room-based sessions with shareable links
- 🔐 OAuth authentication and persistent boards
- 📤 Export to PNG / PDF

> Status: **Phase 0 complete** — foundation, auth, database, CI. See
> [`docs/roadmap.md`](./docs/roadmap.md) for the full plan.

## Tech stack

| Layer        | Choice                                   |
| ------------ | ---------------------------------------- |
| Framework    | Next.js 16 (App Router) · React 19       |
| Language     | TypeScript 5 (strict)                    |
| Styling      | Tailwind CSS v4 + shadcn/ui              |
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

- [Roadmap & phase plan](./docs/roadmap.md)
- [Architecture](./docs/architecture.md)
- [Local setup](./docs/local-setup.md)
- [API reference](./docs/api.md)
- [Database](./docs/database.md)
- [Deployment](./docs/deployment.md)
- [Architecture Decision Records](./docs/decisions/)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). All commits follow
[Conventional Commits](https://www.conventionalcommits.org/) and must pass
lint, type-check, and tests.

## Licensing note

This project's own code is MIT (see [LICENSE](./LICENSE)). It depends on
[**tldraw**](https://github.com/tldraw/tldraw/blob/main/LICENSE.md), which ships
under a **Business Source License** restricting commercial whiteboard products.
That is fine for this portfolio project; review tldraw's license before any
commercial use.
