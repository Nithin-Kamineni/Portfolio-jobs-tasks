// Spaced repetition (SM-2 style, Anki-like grades). Shared by the API (to store the result) and the
// UI (to show "next in 3 d" on each grade button), so both always agree.

export type Grade = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy
export interface SrsState { ease: number; interval_days: number; reps: number; lapses: number }

export function schedule(s: SrsState, grade: Grade): SrsState {
  let { ease, interval_days: iv, reps, lapses } = s;
  if (grade === 1) return { ease: Math.max(1.3, ease - 0.2), interval_days: 0, reps: 0, lapses: lapses + 1 };
  if (grade === 2) { ease = Math.max(1.3, ease - 0.15); iv = reps === 0 ? 1 : Math.max(iv + 1, Math.round(iv * 1.2)); }
  if (grade === 3) iv = reps === 0 ? 1 : reps === 1 ? 3 : Math.max(iv + 1, Math.round(iv * ease));
  if (grade === 4) { iv = reps === 0 ? 4 : Math.max(iv + 2, Math.round(iv * ease * 1.3)); ease = Math.min(3.5, ease + 0.15); }
  return { ease: Math.round(ease * 100) / 100, interval_days: Math.min(iv, 365), reps: reps + 1, lapses };
}

/** YYYY-MM-DD in US Eastern time, `days` from now. */
export function dayPlus(days: number, from = new Date()): string {
  const d = new Date(from.getTime() + days * 864e5);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

export const intervalLabel = (days: number) => (days <= 0 ? '<10 min' : days === 1 ? '1 day' : days < 30 ? `${days} days` : days < 365 ? `${Math.round(days / 30)} mo` : '1 yr');
