import { describe, expect, it } from 'vitest';

import { DEFAULT_CALLBACK_PATH, signInErrorMessage, toCallbackPath } from '@/lib/sign-in';

describe('toCallbackPath', () => {
  it('falls back to the dashboard when no callback is given', () => {
    expect(toCallbackPath(undefined)).toBe(DEFAULT_CALLBACK_PATH);
  });

  it('keeps a relative board invite path with its share token', () => {
    expect(toCallbackPath('/board/abc?t=tok123')).toBe('/board/abc?t=tok123');
  });

  it('reduces an absolute same-site URL to its path, query and hash', () => {
    expect(toCallbackPath('https://collab.example/board/abc?t=tok#x')).toBe('/board/abc?t=tok#x');
  });

  it('strips a foreign origin so it can never redirect off-site', () => {
    expect(toCallbackPath('https://evil.example/board/abc')).toBe('/board/abc');
  });

  it('rejects protocol-relative and backslash paths', () => {
    expect(toCallbackPath('//evil.example/x')).toBe(DEFAULT_CALLBACK_PATH);
    expect(toCallbackPath('/\\evil.example')).toBe(DEFAULT_CALLBACK_PATH);
  });

  it('rejects non-http schemes', () => {
    expect(toCallbackPath('javascript:alert(1)')).toBe(DEFAULT_CALLBACK_PATH);
  });

  it('never loops back to the login page', () => {
    expect(toCallbackPath('/login?callbackUrl=/board/a')).toBe(DEFAULT_CALLBACK_PATH);
  });

  it('uses the first value when the param repeats', () => {
    expect(toCallbackPath(['/board/a', '/board/b'])).toBe('/board/a');
  });
});

describe('signInErrorMessage', () => {
  it('returns null when there is no error', () => {
    expect(signInErrorMessage(undefined)).toBeNull();
  });

  it('explains an account linked to another provider', () => {
    expect(signInErrorMessage('OAuthAccountNotLinked')).toMatch(/another provider/i);
  });

  it('explains a denied sign-in', () => {
    expect(signInErrorMessage('AccessDenied')).toMatch(/denied/i);
  });

  it('falls back to a generic retry message for unknown codes', () => {
    expect(signInErrorMessage('SomethingNew')).toMatch(/try again/i);
  });
});
