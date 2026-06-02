import type { ZodError } from 'zod';

// Collapse a ZodError into a flat { field: firstMessage } map for API responses.
// Form-level errors (refinements with no path) are keyed under "_".
export function flattenFieldErrors(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '_';
    if (!(key in fields)) fields[key] = issue.message;
  }
  return fields;
}
