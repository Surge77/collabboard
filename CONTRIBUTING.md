# Contributing to CollabBoard

Thanks for your interest! This guide covers the workflow and standards.

## Prerequisites

- Node.js 20+
- pnpm 9+ (`corepack enable` to get it)
- A Neon (or any PostgreSQL) database for full local runs

## Setup

```bash
pnpm install
cp .env.example .env.local   # fill in values — see docs/local-setup.md
pnpm db:generate
pnpm dev
```

## Branching

- `main` — production, protected. Never commit directly.
- `develop` — integration branch. Open PRs against this.
- `feat/<name>`, `fix/<name>`, `chore/<name>` — topic branches off `develop`.

```bash
git checkout develop && git pull
git checkout -b feat/your-feature
```

## Commits

We use [Conventional Commits](https://www.conventionalcommits.org/), enforced by
commitlint via a git hook.

```
feat(board): add live cursor presence
fix(auth): handle expired session redirect
docs: update local setup guide
```

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
`chore`, `revert`, `ci`. Subject ≤ 72 characters.

## Before you push

The pre-commit hook runs lint-staged automatically, but run the full gate too:

```bash
pnpm lint
pnpm type-check
pnpm test
```

## Tests

- New features need tests. Bug fixes start with a failing regression test.
- Unit/integration tests: Vitest (`tests/`). E2E: Playwright (`tests/e2e/`).
- Target ≥ 80% coverage on `src/lib/` and `src/hooks/`.

## Pull requests

1. Fill in the PR template.
2. Ensure CI is green (lint, type-check, test, build).
3. PRs target `develop`. A maintainer reviews and merges.

## Code style

See [CLAUDE.md](./CLAUDE.md) for the full project conventions — they apply to
human and AI contributors alike.
