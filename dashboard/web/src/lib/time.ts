// Date helpers for display. Dates from the API are ISO strings (UTC) or YYYY-MM-DD (local calendar days).

export function relTime(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return 'never';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const s = Math.round((now.getTime() - t) / 1000);
  const abs = Math.abs(s);
  const fmt = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;
  const out = abs < 60 ? 'just now' : abs < 3600 ? fmt(Math.round(abs / 60), 'min') : abs < 86400 ? fmt(Math.round(abs / 3600), 'hour') : fmt(Math.round(abs / 86400), 'day');
  if (out === 'just now') return out;
  return s >= 0 ? `${out} ago` : `in ${out}`;
}

export function shortDate(d: string | null | undefined): string {
  if (!d) return '';
  const day = /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T12:00:00`) : new Date(d);
  if (Number.isNaN(day.getTime())) return d;
  return day.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: day.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
}

export function localToday(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}
