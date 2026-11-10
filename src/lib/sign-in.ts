export const DEFAULT_CALLBACK_PATH = '/dashboard';

// Placeholder origin used only to parse relative paths; never emitted.
const PARSE_BASE = 'http://callback.invalid';

// Turns the `callbackUrl` Auth.js appends to /login into a same-site path, so an
// invited user lands back on the board they were invited to. Only the path,
// query and hash survive: a foreign origin is dropped rather than followed.
export function toCallbackPath(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return DEFAULT_CALLBACK_PATH;

  const isRelative = value.startsWith('/');
  if (isRelative && (value.startsWith('//') || value.startsWith('/\\'))) {
    return DEFAULT_CALLBACK_PATH;
  }

  let url: URL;
  try {
    url = new URL(value, PARSE_BASE);
  } catch {
    return DEFAULT_CALLBACK_PATH;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return DEFAULT_CALLBACK_PATH;
  if (url.pathname.startsWith('/login')) return DEFAULT_CALLBACK_PATH;

  return `${url.pathname}${url.search}${url.hash}`;
}

const SIGN_IN_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked:
    'This email is already linked to another provider. Sign in with the provider you used first.',
  AccessDenied: 'Sign-in was denied. Check that you granted access, then try again.',
  Configuration: 'Sign-in is temporarily unavailable. Please try again in a few minutes.',
};

const GENERIC_SIGN_IN_ERROR = 'Sign-in did not complete. Please try again.';

// Maps an Auth.js `?error=` code to a message that names the problem and the
// recovery. Unknown codes get a generic retry message, never the raw code.
export function signInErrorMessage(code: string | string[] | undefined): string | null {
  const value = Array.isArray(code) ? code[0] : code;
  if (!value) return null;
  return SIGN_IN_ERRORS[value] ?? GENERIC_SIGN_IN_ERROR;
}
