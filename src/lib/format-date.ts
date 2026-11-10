// Fixed locale + UTC so the server render and client hydration produce the same
// string; a host-locale toLocaleDateString() can differ between the two.
const EDITED_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatEdited(iso: string): string {
  return EDITED_FORMAT.format(new Date(iso));
}
