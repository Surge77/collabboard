# API Reference

All routes are App Router route handlers under `src/app/api/`. Every handler
verifies the session with `await auth()` before touching the database, validates
input with Zod, and returns JSON.

## Conventions

- **Auth:** unauthenticated requests get `401`.
- **Validation:** invalid bodies get `400` with field-level details.
- **Errors:** server errors get `500` with a generic message (no internals leaked).

## Implemented

### `GET|POST /api/auth/[...nextauth]`

Auth.js v5 handlers (sign in, callback, sign out, session). Provided by
`handlers` from `src/lib/auth.ts`.

## Planned

### Phase 1 — Boards

| Method   | Path               | Description              |
| -------- | ------------------ | ------------------------ |
| `GET`    | `/api/boards`      | List the user's boards   |
| `POST`   | `/api/boards`      | Create a board           |
| `GET`    | `/api/boards/[id]` | Get one board            |
| `PATCH`  | `/api/boards/[id]` | Update title / visibility|
| `DELETE` | `/api/boards/[id]` | Delete a board           |

### Phase 3 — Realtime

| Method | Path                   | Description                          |
| ------ | ---------------------- | ------------------------------------ |
| `POST` | `/api/liveblocks-auth` | Issue a Liveblocks room access token |

### Phase 4 — AI

| Method | Path               | Description                         |
| ------ | ------------------ | ----------------------------------- |
| `POST` | `/api/ai/generate` | Text prompt → tldraw shapes (stream)|
| `POST` | `/api/ai/analyze`  | Canvas snapshot → summary (stream)  |
