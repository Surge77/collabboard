const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';

// Pulls the user-safe message out of the API's error envelope
// ({ success: false, error: { code, message } }), falling back to a generic one.
export async function readError(res: Response): Promise<string> {
  const body: unknown = await res.json().catch(() => null);
  if (
    body &&
    typeof body === 'object' &&
    'error' in body &&
    body.error &&
    typeof body.error === 'object' &&
    'message' in body.error &&
    typeof body.error.message === 'string'
  ) {
    return body.error.message;
  }
  return FALLBACK_MESSAGE;
}
