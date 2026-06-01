import { describe, expect, it } from 'vitest';

import { authConfig } from '@/lib/auth.config';

const authorized = authConfig.callbacks!.authorized!;
const jwt = authConfig.callbacks!.jwt!;
const session = authConfig.callbacks!.session!;

type AuthorizedArg = Parameters<typeof authorized>[0];

function buildAuthorizedArg(pathname: string, loggedIn: boolean): AuthorizedArg {
  return {
    auth: loggedIn ? { user: { id: 'u1' } } : null,
    request: { nextUrl: new URL(`http://localhost${pathname}`) },
  } as unknown as AuthorizedArg;
}

describe('authorized callback', () => {
  it('blocks an unauthenticated user from /dashboard', () => {
    expect(authorized(buildAuthorizedArg('/dashboard', false))).toBe(false);
  });

  it('blocks an unauthenticated user from /board/abc', () => {
    expect(authorized(buildAuthorizedArg('/board/abc', false))).toBe(false);
  });

  it('allows an authenticated user into /dashboard', () => {
    expect(authorized(buildAuthorizedArg('/dashboard', true))).toBe(true);
  });

  it('allows anyone onto a public route', () => {
    expect(authorized(buildAuthorizedArg('/', false))).toBe(true);
    expect(authorized(buildAuthorizedArg('/login', false))).toBe(true);
  });
});

describe('jwt callback', () => {
  it('copies the user id onto the token on sign-in', () => {
    const token = jwt({
      token: {},
      user: { id: 'user-123' },
    } as unknown as Parameters<typeof jwt>[0]);
    expect(token).toMatchObject({ id: 'user-123' });
  });

  it('leaves the token unchanged on subsequent calls', () => {
    const token = jwt({
      token: { id: 'user-123' },
    } as unknown as Parameters<typeof jwt>[0]);
    expect(token).toMatchObject({ id: 'user-123' });
  });
});

describe('session callback', () => {
  it('exposes the token id on the session user', () => {
    const result = session({
      session: { user: { name: 'A' } },
      token: { id: 'user-123' },
    } as unknown as Parameters<typeof session>[0]);
    expect(result.user).toMatchObject({ id: 'user-123' });
  });

  it('ignores a non-string token id', () => {
    const result = session({
      session: { user: { name: 'A' } },
      token: { id: 42 },
    } as unknown as Parameters<typeof session>[0]);
    expect((result.user as { id?: string }).id).toBeUndefined();
  });
});
