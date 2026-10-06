const formatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Budapest',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function formatPublicationTime(value: string): string {
  return formatter.format(new Date(value)).replace(' ', 'T');
}

// datetime-local carries no offset. Interpret it in the same explicit timezone
// used by the editor, independently of the deployment server's timezone.
export function parsePublicationTime(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const wallTime = Date.parse(`${value}:00Z`);
  if (!Number.isFinite(wallTime)) return null;
  for (const offset of [2, 1]) {
    const candidate = new Date(wallTime - offset * 60 * 60 * 1000);
    if (formatPublicationTime(candidate.toISOString()) === value) return candidate;
  }
  return null;
}

export function newsPublicationLabel(item: { published: boolean; published_at: string | null }) {
  if (!item.published) return 'Piszkozat';
  if (!item.published_at || new Date(item.published_at).getTime() > Date.now()) return 'Időzített';
  return 'Publikált';
}
