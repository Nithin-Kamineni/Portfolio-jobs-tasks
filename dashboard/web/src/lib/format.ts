import type { ChipProps } from '@mui/material';
import { STATUS_LABEL, type JobStatus } from '../../../shared/statuses';
import type { Job } from '../../../shared/types';

export const statusLabel = (s: string) => STATUS_LABEL[s as JobStatus] || s;

export function statusColor(s: string): ChipProps['color'] {
  switch (s) {
    case 'new': return 'info';
    case 'ranked': return 'primary';
    case 'apply_referral': return 'secondary';
    case 'applied': case 'interview': return 'success';
    default: return 'default';
  }
}

export function priorityColor(p: string): ChipProps['color'] {
  return p === 'A' ? 'primary' : p === 'B' ? 'secondary' : 'default';
}

/** Claude's fit score when ranked, else the watcher's keyword score (different scale, shown greyed). */
export function fitInfo(j: Pick<Job, 'fit_score' | 'score'>): { value: number | null; ranked: boolean; sortKey: number } {
  if (j.fit_score != null) return { value: j.fit_score, ranked: true, sortKey: 1000 + j.fit_score };
  return { value: j.score, ranked: false, sortKey: j.score ?? -1 };
}

export function fitColor(v: number | null, ranked: boolean): ChipProps['color'] {
  if (!ranked || v == null) return 'default';
  return v >= 75 ? 'success' : v >= 50 ? 'primary' : v >= 30 ? 'warning' : 'error';
}

export const FLAG_HELP: Record<string, string> = {
  'No sponsorship': 'The posting says it does not sponsor visas. CPT may still work for an internship; check the details.',
  'Citizenship/clearance': 'Requires U.S. citizenship, a security clearance or export-control eligibility: usually skip (F-1).',
  "Bachelor's only": 'Aimed at undergraduates.',
  'Posted > 30 days': 'Posted more than 30 days ago; it may be filled or closing soon.',
};

/** Short chip labels for the grid. */
export const FLAG_SHORT: Record<string, string> = {
  'No sponsorship': 'No visa', 'Citizenship/clearance': 'Citizen only', "Bachelor's only": 'BS only', 'Posted > 30 days': '> 30 days',
};

export function isHtml(s: string): boolean {
  return /<\/?(p|div|br|ul|ol|li|h[1-6]|strong|b|em|span|table)\b/i.test(s);
}

/** v2 ranking stage, for the "quick" / "checked" marker next to the fit score. */
export const STAGE_INFO: Record<string, { mark: string; help: string }> = {
  final: { mark: '✓', help: 'Checked by Opus (final check)' },
  quick: { mark: 'q', help: 'Quick score (Sonnet); not re-checked (under 60, or not yet)' },
  rule: { mark: 'r', help: 'Set by a rule (no model): clearance, domain or degree' },
};

/** "you applied Sep 30" / "you skipped it" for a re-post's older posting. */
export function previousOutcome(p: { status: string; applied_date: string | null; decision_at: string | null }): string {
  const day = (d: string | null) => (d ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T12:00:00` : d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '');
  switch (p.status) {
    case 'applied': case 'interview': return `you applied ${day(p.applied_date)}`.trim() + (p.status !== 'applied' ? ` (${p.status})` : '');
    case 'skip': return 'you skipped it';
    case 'later': return 'you marked it Later';
    case 'apply_referral': return 'you were asking for a referral';
    case 'closed': return 'it was closed';
    default: return 'not decided';
  }
}

/** "2 d 4 h 12 min" (with seconds: "… 05 s"): a duration for the live countdown on Home. */
export function fmtElapsed(ms: number, seconds = false): string {
  const t = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(t / 86400); const h = Math.floor((t % 86400) / 3600); const m = Math.floor((t % 3600) / 60); const s = t % 60;
  const parts = [d ? `${d} d` : '', d || h ? `${h} h` : '', `${m} min`].filter(Boolean);
  if (seconds) parts.push(`${String(s).padStart(2, '0')} s`);
  return parts.join(' ');
}

/** Home countdown colour: fine for a day, amber after 24 h, red after 72 h. */
export const searchAgeColor = (ms: number): 'success' | 'warning' | 'error' => (ms >= 72 * 3600e3 ? 'error' : ms >= 24 * 3600e3 ? 'warning' : 'success');

/** The company name without the trailing "(…)" part. */
export const shortCompany = (name: string) => name.replace(/\s*\(.*$/, '') || name;
