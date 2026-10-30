// Regenerates jobs/tracker.csv from the database: a read-only snapshot kept in git as history.
// The columns are a superset of the watcher's old format, so migrateTracker() can re-import it (round trip).
import fs from 'node:fs';
import path from 'node:path';
import type { DB } from './db';
import { listJobs } from './repo';
import { csvCell } from '../../watcher/lib/util.js';

export const TRACKER_COLUMNS = [
  'id', 'date_found', 'first_seen', 'company', 'priority', 'title', 'location', 'score', 'fit_score', 'fit_reason', 'ranked_at',
  'tags', 'url', 'source', 'posted', 'degrees', 'status', 'decision_at', 'applied_date', 'outcome_date',
  'referral', 'resume_version', 'application_dir', 'notes',
] as const;

export function trackerCsv(db: DB): string {
  const referral = new Map<string, string>();
  for (const r of db.prepare("SELECT job_id, status FROM outreach WHERE type = 'referral' AND job_id IS NOT NULL").all() as { job_id: string; status: string }[]) {
    const rank = (s: string) => ({ referred: 3, sent: 2, replied: 2, declined: 1, no_reply: 1, ready: 0, draft: 0 } as Record<string, number>)[s] ?? 0;
    const cur = referral.get(r.job_id);
    if (!cur || rank(r.status) > rank(cur)) referral.set(r.job_id, r.status);
  }
  const jobs = listJobs(db, { sort: 'first_seen', order: 'asc' });
  const lines = jobs.map((j) => {
    const row: Record<(typeof TRACKER_COLUMNS)[number], unknown> = {
      id: j.id, date_found: j.first_seen.slice(0, 10), first_seen: j.first_seen, company: j.company, priority: j.company_priority,
      title: j.title, location: j.location, score: j.score ?? '', fit_score: j.fit_score ?? '', fit_reason: j.fit_reason ?? '',
      ranked_at: j.ranked_at ?? '', tags: j.tags.join('; '), url: j.url, source: j.source, posted: j.posted_date, degrees: j.degrees,
      status: j.status, decision_at: j.decision_at ?? '', applied_date: j.applied_date ?? '', outcome_date: j.outcome_date ?? '',
      referral: referral.get(j.id) ?? '', resume_version: j.resume_version, application_dir: j.application_dir ?? '', notes: j.notes ?? '',
    };
    return TRACKER_COLUMNS.map((c) => csvCell(row[c])).join(',');
  });
  return [TRACKER_COLUMNS.join(','), ...lines].join('\n') + '\n';
}

/** Writes jobs/tracker.csv. A locked file (open in Excel) gives a warning instead of an error. */
export function exportTracker(db: DB, repoRoot: string): { path: string; rows: number; warning: string | null } {
  const file = path.join(repoRoot, 'jobs', 'tracker.csv');
  const csv = trackerCsv(db);
  const rows = (db.prepare('SELECT count(*) AS n FROM jobs').get() as { n: number }).n;
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === csv) return { path: file, rows, warning: null };
    fs.writeFileSync(file, csv);
    return { path: file, rows, warning: null };
  } catch (e) {
    return { path: file, rows, warning: `Couldn't write jobs/tracker.csv (is it open in Excel?): ${(e as Error).message}` };
  }
}
