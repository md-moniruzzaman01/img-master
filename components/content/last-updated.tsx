/** "Last updated 23 October 2026" with a machine-readable <time>. */
export function LastUpdated({ date }: { date: string }) {
  const iso = date.slice(0, 10);
  const d = new Date(`${iso}T00:00:00Z`);
  const label = Number.isNaN(d.getTime())
    ? date
    : new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(d);
  return (
    <p className="mt-8 type-small text-muted lg:mt-12">
      Last updated <time dateTime={iso}>{label}</time>
    </p>
  );
}
