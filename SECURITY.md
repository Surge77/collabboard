# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability, **please do not open a public issue.**
Instead, report it privately via
[GitHub Security Advisories](https://github.com/Surge77/collabboard/security/advisories/new).

Include:

- A description of the vulnerability and its impact
- Steps to reproduce
- Affected version / commit

You can expect an acknowledgement within a few days. Please give us reasonable
time to address the issue before public disclosure.

## Scope and practices

- Secrets live only in `.env.local` (gitignored) and Vercel environment
  variables — never in the repository.
- All API routes verify the authenticated session before any database access.
- User input is validated with Zod at every boundary.
- Prisma parameterizes all queries; raw SQL is not used.
- Only `NEXT_PUBLIC_*` environment variables are exposed to the browser.

## Supported versions

The project is pre-1.0; only the latest `main` is supported.
