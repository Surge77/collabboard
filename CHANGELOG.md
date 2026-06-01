# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added — Phase 0 (Foundation)

- Next.js 16 + React 19 + TypeScript (strict) project scaffold.
- Tailwind CSS v4 (CSS-first config) and the App Router.
- Auth.js v5 (NextAuth) with Google and GitHub OAuth providers.
- Prisma 6 ORM with the full Auth.js schema (`User`, `Account`, `Session`,
  `VerificationToken`) plus the `Board` model, targeting Neon PostgreSQL.
- Edge-safe auth split (`auth.config.ts` + `auth.ts`) and a Next 16 `proxy`
  for route protection.
- Landing page, OAuth login page, and a protected dashboard with sign-out.
- Tooling: ESLint (flat config), Prettier, EditorConfig, Vitest, Playwright,
  Husky + lint-staged + commitlint.
- GitHub Actions CI: lint, type-check, test (with coverage), and build.
- Project documentation, ADRs, and contribution guides.

[Unreleased]: https://github.com/Surge77/collabboard/commits/main
