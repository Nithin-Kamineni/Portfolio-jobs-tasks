// Manual companies (no public feed): postings found by Claude in Chrome are added with `cli job add`, which applies the
// watcher's own filters, and each visit is recorded in manual_checks (plan v2 §4).
import crypto from 'node:crypto';
import type { DB } from './db';
import type { Ctx } from './sync';
import { upsertJobs, type UpsertStats } from './importer';
import { addEvent, getJob, HttpError, nowIso } from './repo';
import { legacyNormalizeUrl } from './dedupe';
import { watcherScorer } from './ranking';
import { resolveCompany } from './runs/params';
import { companyKey } from '../shared/statuses';
import { stripHtml } from '../../watcher/lib/util.js';
import { atsFromUrl } from '../../watcher/lib/tags.js';
import type { Job } from '../shared/types';

export interface JobAddInput { company?: string; title?: string; url?: string; location?: string; posted?: string; description?: string; source?: string }
export type JobAddResult =
  | { added: true; job: Job }
  | { added: false; job: Job; duplicateOf?: string; reason: string };

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Stable id for a manually found posting: the same URL (tracking parameters ignored) always gives the same id. */
export const manualJobId = (company: string, url: string) =>
  `manual:${slug(companyKey(company))}:${crypto.createHash('sha1').update(legacyNormalizeUrl(url)).digest('hex').slice(0, 12)}`;

/**
 * `cli job add`: validates, applies the watcher's title / US-location / domain filters (a non-matching posting is
 * rejected with a reason, so a browser run can't flood the list), scores it like the watcher and upserts it as `new`.
 */
export function addManualJob(ctx: Ctx, input: JobAddInput): JobAddResult {
  const { db, cfg } = ctx;
  if (!input.company?.trim()) throw new HttpError(400, '--company is required');
  if (!input.title?.trim()) throw new HttpError(400, '--title is required');
  if (!/^https?:\/\/\S+$/i.test(input.url || '')) throw new HttpError(400, '--url must be the posting\'s http(s) URL');
  const company = resolveCompany(db, input.company) || input.company.trim();
  const title = input.title.trim().replace(/\s+/g, ' ');
  const description = String(input.description || '').trim();
  const text = stripHtml(description);
  const S = watcherScorer(cfg.repoRoot);
  const reject = (reason: string) => { throw Object.assign(new HttpError(422, `Not added: ${reason}`), { reason }); };
  if (!S.titleOk(title)) reject('the title is not an internship/research-intern role in scope (the watcher\'s title filter)');
  if (!S.usOk(input.location || '')) reject(`"${input.location}" is not a US location`);
  if (!S.domainOk(title, text)) reject('no chip/hardware topic in the title or description (the domain rule)');
  const { score, hits } = S.score(title, text);
  const id = manualJobId(company, input.url!);
  const stats: UpsertStats = { added: [], merged: [] };
  const existed = Boolean(db.prepare('SELECT 1 FROM jobs WHERE id = ?').get(id));
  upsertJobs(db, [{
    id, company, title, location: input.location || '', url: input.url!, source: input.source || `manual:${company}`, ats: atsFromUrl(input.url),
    posted: /^\d{4}-\d{2}-\d{2}/.test(input.posted || '') ? input.posted!.slice(0, 10) : '', posted_raw: input.posted || '',
    first_seen: nowIso(), score, hits, description,
  }], stats);
  if (stats.merged.length) {
    const into = stats.merged[0].into;
    return { added: false, job: getJob(db, into, false), duplicateOf: into, reason: 'already known (same posting from the company feed or SimplifyJobs)' };
  }
  if (existed) return { added: false, job: getJob(db, id, false), reason: 'already added earlier' };
  addEvent(db, 'job', id, 'manual_added', { company, source: input.source || `manual:${company}` });
  return { added: true, job: getJob(db, id, false) };
}

// ---------- manual_checks ----------
export interface ManualCheck { company: string; checked_at: string | null; result: string | null; found: number | null; added: number | null; note: string | null }

export function markManualChecked(db: DB, company: string, o: { found?: number; added?: number; result?: string; note?: string }): ManualCheck {
  const name = resolveCompany(db, company);
  if (!name) throw new HttpError(400, `Unknown company "${company}"`);
  const result = o.result || 'ok';
  if (!['ok', 'blocked', 'error'].includes(result)) throw new HttpError(400, '--result must be ok, blocked or error');
  const num = (v: unknown) => (v == null || v === '' ? null : Math.max(0, Math.floor(Number(v))) || 0);
  db.prepare(`INSERT INTO manual_checks(company, checked_at, result, found, added, note) VALUES (?,?,?,?,?,?)
    ON CONFLICT(company) DO UPDATE SET checked_at=excluded.checked_at, result=excluded.result, found=excluded.found, added=excluded.added, note=excluded.note`)
    .run(name, nowIso(), result, num(o.found), num(o.added), o.note || null);
  addEvent(db, 'company', name, 'manual_checked', { result, found: num(o.found), added: num(o.added) });
  return db.prepare('SELECT * FROM manual_checks WHERE company = ?').get(name) as ManualCheck;
}

export function manualChecks(db: DB): Map<string, ManualCheck> {
  return new Map((db.prepare('SELECT * FROM manual_checks').all() as ManualCheck[]).map((r) => [r.company, r]));
}

/** Enabled manual companies, and whether each is due (never checked, or longer ago than `hours`; 0 = always due). */
export function manualCompanies(db: DB, hours: number, now = new Date()): { name: string; due: boolean; last: ManualCheck | null }[] {
  const checks = manualChecks(db);
  const rows = db.prepare("SELECT name FROM companies WHERE lower(ats) = 'manual' AND lower(COALESCE(enabled, 'yes')) != 'no' ORDER BY priority, name").all() as { name: string }[];
  return rows.map(({ name }) => {
    const last = checks.get(name) || null;
    const age = last?.checked_at ? (now.getTime() - new Date(last.checked_at).getTime()) / 3600e3 : Infinity;
    return { name, due: hours <= 0 || age >= hours, last };
  });
}
