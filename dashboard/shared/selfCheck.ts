// "Check these yourself" (Home): companies whose career sites even the Claude-in-Chrome check cannot read, so the owner
// searches them by hand. Data-driven: `you_check=yes` in targets/companies.csv (enabled or not), plus every enabled
// `ats=manual` company whose latest manual check ended `blocked` or `error`. Shared by the dashboard and the website.
import type { Company } from './types';

/** Days after which "last checked" turns amber, then red. */
export const SELF_CHECK_WARN_DAYS = 7;
export const SELF_CHECK_ALERT_DAYS = 14;

/** The event an "I checked" click records (entity 'company', entity_id = the company name). Not a manual_checks row. */
export const SELF_CHECK_EVENT = 'self_checked';

export interface SelfCheckCompany {
  name: string;
  careers_url: string;
  reason: string;
  /** Last "I checked" (ISO), or null. */
  checked_at: string | null;
  /** Logo file name under /logos/ (see slugFor). */
  slug: string;
}

export const isYes = (v: unknown) => /^(yes|y|true|1)$/i.test(String(v ?? '').trim());

/** "Tesla (AI hardware)" → "tesla", "Amazon / AWS (Annapurna Labs)" → "amazon-aws". */
export function slugFor(name: string): string {
  return name.replace(/\(.*?\)/g, ' ').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'company';
}

/** The companies to list, in a stable order (oldest check first: the one most due on top). */
export function selfCheckCompanies(companies: Company[]): SelfCheckCompany[] {
  const out: SelfCheckCompany[] = [];
  for (const c of companies) {
    const flagged = isYes(c.you_check);
    const result = String(c.last_check?.result || '').toLowerCase();
    const failing = c.manual && !/^no$/i.test(String(c.enabled || '').trim()) && (result === 'blocked' || result === 'error');
    if (!flagged && !failing) continue;
    const reason = (c.you_check_reason || '').trim()
      || (failing ? `Claude's check was ${result === 'blocked' ? 'blocked' : 'failing'}${c.last_check?.checked_at ? ` (${c.last_check.checked_at.slice(0, 10)})` : ''}` : 'Check this career site yourself');
    out.push({ name: c.name, careers_url: c.careers_url, reason, checked_at: c.self_checked_at ?? null, slug: slugFor(c.name) });
  }
  const t = (s: string | null) => (s ? new Date(s).getTime() : 0);
  return out.sort((a, b) => t(a.checked_at) - t(b.checked_at) || a.name.localeCompare(b.name));
}

/** green / amber / red for the "last checked" age (never checked = red). */
export function selfCheckColor(checkedAt: string | null, now = Date.now()): 'success' | 'warning' | 'error' {
  if (!checkedAt) return 'error';
  const days = (now - new Date(checkedAt).getTime()) / 86400e3;
  return days >= SELF_CHECK_ALERT_DAYS ? 'error' : days >= SELF_CHECK_WARN_DAYS ? 'warning' : 'success';
}

/** "last checked 3 d ago" / "last checked 5 h ago" / "never checked". */
export function checkedAgo(at: string | null, now = Date.now()): string {
  if (!at) return 'never checked';
  const d = Math.floor((now - new Date(at).getTime()) / 86400e3);
  if (d <= 0) {
    const h = Math.floor((now - new Date(at).getTime()) / 3600e3);
    return h <= 0 ? 'last checked just now' : `last checked ${h} h ago`;
  }
  return `last checked ${d} d ago`;
}
