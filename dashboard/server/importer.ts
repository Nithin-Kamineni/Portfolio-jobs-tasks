// Imports watcher output into SQLite. Every import is idempotent: each file is recorded in `imports`,
// and job rows are upserted by id without touching decisions, ranks or notes.
import fs from 'node:fs';
import path from 'node:path';
import { nextId, type DB } from './db';
import { addEvent, nowIso } from './repo';
import { companyKey, isJobStatus, LEGACY_STATUS, RELATIONSHIPS } from '../shared/statuses';
import { parseCSV } from '../../watcher/lib/util.js';
import { ALL_TAGS, deriveFlags, deriveTags, normalizePosted, atsFromUrl } from '../../watcher/lib/tags.js';
import { backfillDedupe, findPreviousPosting, findSamePosting, normalizeUrl, repostKey, reqIdFrom } from './dedupe';

export const DEDUPE_BACKFILL_KEY = 'migration:v2-dedupe';

/** Once per database (v2 P4): keys for every job, exact duplicates merged, re-posts linked. Logged as an event. */
export function runDedupeBackfill(db: DB): ReturnType<typeof backfillDedupe> | null {
  if (isImported(db, DEDUPE_BACKFILL_KEY)) return null;
  const out = backfillDedupe(db, nowIso());
  db.prepare('INSERT INTO imports(file, imported_at, rows) VALUES (?,?,?)').run(DEDUPE_BACKFILL_KEY, nowIso(), out.merged.length);
  addEvent(db, 'system', null, 'dedupe_backfill', out);
  return out;
}

export interface InboxRecord {
  id: string; company: string; company_priority?: string; title: string; location?: string; url?: string; source?: string;
  ats?: string; posted?: string; posted_raw?: string; first_seen?: string; score?: number; hits?: string[]; tags?: string[];
  flags?: string[]; degrees?: string; sponsorship?: string; description?: string;
}

const priorityLookup = (db: DB) => {
  const rows = db.prepare('SELECT name, priority FROM companies').all() as { name: string; priority: string }[];
  const map = new Map(rows.map((r) => [companyKey(r.name), r.priority || '']));
  return (company: string) => map.get(companyKey(company)) || '';
};

/** Record tags plus derived ones, in the canonical tag order (unknown tags last). */
const mergeTags = (given: string[] | undefined, derived: string[]) => {
  const all = [...new Set([...(given || []), ...derived])];
  const pos = (t: string) => { const i = ALL_TAGS.indexOf(t); return i < 0 ? 99 : i; };
  return all.sort((a, b) => pos(a) - pos(b));
};

/** Inserts new jobs; for existing ids, fills in only fields that are still empty (never status, rank or notes). */
export function upsertJobs(db: DB, records: InboxRecord[], stats?: UpsertStats): number {
  const prio = priorityLookup(db);
  const stmt = db.prepare(`INSERT INTO jobs(id, company, company_priority, title, location, url, source, ats, posted_date, posted_raw, first_seen,
      score, hits_json, tags_json, flags_json, degrees, sponsorship_flag, description, description_fetched_at, status, updated_at)
    VALUES (@id, @company, @company_priority, @title, @location, @url, @source, @ats, @posted_date, @posted_raw, @first_seen,
      @score, @hits_json, @tags_json, @flags_json, @degrees, @sponsorship_flag, @description, @description_fetched_at, 'new', @updated_at)
    ON CONFLICT(id) DO UPDATE SET
      description = CASE WHEN jobs.description = '' THEN excluded.description ELSE jobs.description END,
      description_fetched_at = CASE WHEN jobs.description = '' AND excluded.description != '' THEN excluded.description_fetched_at ELSE jobs.description_fetched_at END,
      hits_json = CASE WHEN jobs.hits_json = '[]' THEN excluded.hits_json ELSE jobs.hits_json END,
      tags_json = CASE WHEN jobs.description = '' AND excluded.description != '' OR jobs.tags_json = '[]' THEN excluded.tags_json ELSE jobs.tags_json END,
      flags_json = CASE WHEN jobs.description = '' AND excluded.description != '' OR jobs.flags_json = '[]' THEN excluded.flags_json ELSE jobs.flags_json END,
      posted_date = CASE WHEN jobs.posted_date = '' THEN excluded.posted_date ELSE jobs.posted_date END,
      posted_raw = CASE WHEN jobs.posted_raw = '' THEN excluded.posted_raw ELSE jobs.posted_raw END,
      degrees = CASE WHEN jobs.degrees = '' THEN excluded.degrees ELSE jobs.degrees END,
      sponsorship_flag = CASE WHEN jobs.sponsorship_flag = '' THEN excluded.sponsorship_flag ELSE jobs.sponsorship_flag END,
      company_priority = CASE WHEN jobs.company_priority = '' THEN excluded.company_priority ELSE jobs.company_priority END,
      ats = CASE WHEN jobs.ats = '' THEN excluded.ats ELSE jobs.ats END`);
  let inserted = 0;
  const exists = db.prepare('SELECT 1 FROM jobs WHERE id = ?');
  const alias = db.prepare('INSERT OR IGNORE INTO job_aliases(alias_id, job_id, reason, at) VALUES (?,?,?,?)');
  const keys = db.prepare('UPDATE jobs SET canonical_url = ?, req_id = ?, repost_key = ?, previous_posting_id = ? WHERE id = ?');
  const at = nowIso();
  for (const r of records) {
    if (!r?.id || !r.title) continue;
    const posted = r.posted || normalizePosted(r.posted_raw, r.first_seen || at);
    const description = r.description || '';
    const hits = r.hits || [];
    // The literally same posting from another source (same normalized URL / requisition number) → no second row:
    // the upsert below only fills the existing row's empty fields (§3.9).
    let id = r.id;
    if (!exists.get(id)) {
      const same = findSamePosting(db, { id, company: r.company || '', url: r.url });
      if (same) { alias.run(id, same, 'same posting', at); id = same; stats?.merged.push({ id: r.id, into: same }); }
    }
    const isNew = !exists.get(id);
    stmt.run({
      id, company: r.company || '', company_priority: r.company_priority || prio(r.company || ''), title: r.title,
      location: r.location || '', url: r.url || '', source: r.source || '', ats: r.ats || atsFromUrl(r.url),
      posted_date: posted, posted_raw: r.posted_raw || '', first_seen: r.first_seen || at, score: r.score ?? null,
      hits_json: JSON.stringify(hits),
      tags_json: JSON.stringify(mergeTags(r.tags, deriveTags({ title: r.title, description, hits }))),
      flags_json: JSON.stringify(r.flags ?? deriveFlags({ title: r.title, description, sponsorship: r.sponsorship, degrees: r.degrees, posted, now: r.first_seen || at })),
      degrees: r.degrees || '', sponsorship_flag: r.sponsorship || '', description,
      description_fetched_at: description ? (r.first_seen || at) : null, updated_at: at,
    });
    if (isNew) {
      inserted++;
      // A re-post (same company + title, new id) is a normal new job, linked to the older posting (never hidden).
      const key = repostKey(r.company || '', r.title) || null;
      const prev = findPreviousPosting(db, { id, repost_key: key, first_seen: r.first_seen || at });
      keys.run(normalizeUrl(r.url) || null, reqIdFrom(r.url, id) || null, key, prev, id);
      stats?.added.push(id);
    }
  }
  return inserted;
}

export interface UpsertStats { added: string[]; merged: { id: string; into: string }[] }

export function parseJsonl(text: string): { records: InboxRecord[]; bad: number } {
  const records: InboxRecord[] = []; let bad = 0;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try { records.push(JSON.parse(line)); } catch { bad++; }
  }
  return { records, bad };
}

const isImported = (db: DB, file: string) => Boolean(db.prepare('SELECT 1 FROM imports WHERE file = ?').get(file));

/** Imports one inbox file's text under its repo-relative name, once. Returns the number of new jobs, or null if already imported. */
export function importInboxText(db: DB, file: string, text: string): number | null {
  if (isImported(db, file)) return null;
  return db.transaction(() => {
    const { records } = parseJsonl(text);
    const n = upsertJobs(db, records);
    db.prepare('INSERT INTO imports(file, imported_at, rows) VALUES (?,?,?)').run(file, nowIso(), records.length);
    addEvent(db, 'import', file, 'inbox', { rows: records.length, new: n });
    return n;
  })();
}

export function importInboxDir(db: DB, repoRoot: string): { files: string[]; jobs: number } {
  const dir = path.join(repoRoot, 'jobs', 'inbox');
  const files: string[] = []; let jobs = 0;
  if (!fs.existsSync(dir)) return { files, jobs };
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.jsonl')).sort()) {
    const rel = `jobs/inbox/${f}`;
    const n = importInboxText(db, rel, fs.readFileSync(path.join(dir, f), 'utf8'));
    if (n != null) { files.push(rel); jobs += n; }
  }
  return { files, jobs };
}

// ---------- digests (used to enrich the tracker.csv backfill, and for watcher health) ----------
export interface DigestRow { score: number; company: string; title: string; url: string; location: string; posted_raw: string; hits: string[]; degrees: string }
export interface Digest { file: string; at: string | null; rows: DigestRow[]; errors: string[] }

export function parseDigest(md: string, file = ''): Digest {
  const m = path.basename(file).match(/^(\d{4}-\d{2}-\d{2})_(\d{2})(\d{2})/);
  const head = md.match(/^# Job digest: (\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}) UTC/m);
  const at = head ? `${head[1]}T${head[2]}:00.000Z` : m ? `${m[1]}T${m[2]}:${m[3]}:00.000Z` : null;
  const rows: DigestRow[] = [];
  for (const line of md.split(/\r?\n/)) {
    const r = line.match(/^\| (-?\d+) \| (.*?) \| \[(.*)\]\((\S*?)\) \| (.*?) \| (.*?) \| (.*?) \|$/);
    if (!r) continue;
    let why = r[7]; let degrees = '';
    const d = why.match(/\s*\(([^()]*)\)$/);
    if (d && /phd|master|bachelor|associate/i.test(d[1])) { degrees = d[1]; why = why.slice(0, d.index); }
    rows.push({ score: Number(r[1]), company: r[2], title: r[3], url: r[4], location: r[5], posted_raw: r[6], hits: why.split(',').map((s) => s.trim()).filter(Boolean), degrees });
  }
  const errSection = md.split(/^## Sources with errors\s*$/m)[1];
  const errors = errSection ? errSection.split(/^## |^<details>/m)[0].split(/\r?\n/).filter((l) => l.startsWith('- ')).map((l) => l.slice(2).trim()) : [];
  return { file, at, rows, errors };
}

export function readDigests(repoRoot: string): Digest[] {
  const dir = path.join(repoRoot, 'jobs', 'digests');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()
    .map((f) => parseDigest(fs.readFileSync(path.join(dir, f), 'utf8'), `jobs/digests/${f}`));
}

// ---------- one-time tracker.csv migration ----------
export const TRACKER_IMPORT_KEY = 'jobs/tracker.csv';

/** Converts tracker.csv rows (the watcher's original format or the dashboard's export) into inbox-style records. */
export function trackerRowsToRecords(rows: Record<string, string>[], digests: Digest[]): { rec: InboxRecord; extra: Record<string, string> }[] {
  const byUrl = new Map<string, { row: DigestRow; at: string | null }>();
  for (const d of digests) for (const row of d.rows) byUrl.set(row.url, { row, at: d.at });
  return rows.filter((r) => r.id && r.title).map((r) => {
    const dg = byUrl.get(r.url);
    const firstSeen = r.first_seen || (dg?.at && dg.at.slice(0, 10) === r.date_found ? dg.at : r.date_found ? `${r.date_found}T00:00:00.000Z` : '');
    const posted = r.posted || normalizePosted(dg?.row.posted_raw, dg?.at || firstSeen);
    const rec: InboxRecord = {
      id: r.id, company: r.company, company_priority: r.priority || '', title: r.title, location: r.location, url: r.url,
      source: r.source, posted, posted_raw: dg?.row.posted_raw || '', first_seen: firstSeen,
      score: r.score === '' || r.score == null ? undefined : Number(r.score),
      hits: dg?.row.hits || [], degrees: r.degrees || dg?.row.degrees || '',
      tags: r.tags ? r.tags.split(';').map((s) => s.trim()).filter(Boolean) : undefined,
    };
    return { rec, extra: r };
  });
}

export function migrateTracker(db: DB, repoRoot: string): number | null {
  if (isImported(db, TRACKER_IMPORT_KEY)) return null;
  const file = path.join(repoRoot, 'jobs', 'tracker.csv');
  const rows = fs.existsSync(file) ? parseCSV(fs.readFileSync(file, 'utf8')) : [];
  const items = trackerRowsToRecords(rows, readDigests(repoRoot));
  return db.transaction(() => {
    const n = upsertJobs(db, items.map((i) => i.rec));
    const upd = db.prepare(`UPDATE jobs SET status=@status, fit_score=@fit_score, fit_reason=@fit_reason, ranked_at=@ranked_at,
        decision_at=@decision_at, applied_date=@applied_date, outcome_date=@outcome_date, resume_version=@resume_version,
        application_dir=@application_dir, notes=@notes WHERE id=@id`);
    for (const { extra: r } of items) {
      upd.run({
        id: r.id, status: isJobStatus(r.status) ? r.status : LEGACY_STATUS[r.status] ?? 'new',
        fit_score: r.fit_score ? Number(r.fit_score) : null, fit_reason: r.fit_reason || null, ranked_at: r.fit_score ? (r.ranked_at || null) : null,
        decision_at: r.decision_at || null, applied_date: r.applied_date || null, outcome_date: r.outcome_date || null,
        resume_version: r.resume_version || 'master', application_dir: r.application_dir || null, notes: r.notes || null,
      });
    }
    db.prepare('INSERT INTO imports(file, imported_at, rows) VALUES (?,?,?)').run(TRACKER_IMPORT_KEY, nowIso(), items.length);
    addEvent(db, 'import', TRACKER_IMPORT_KEY, 'tracker_migration', { rows: items.length, new: n });
    return n;
  })();
}

// ---------- targets/companies.csv (mirrored on every sync) and targets/people.csv (imported once) ----------
export function mirrorCompanies(db: DB, repoRoot: string): number {
  const file = path.join(repoRoot, 'targets', 'companies.csv');
  if (!fs.existsSync(file)) return 0;
  const rows = parseCSV(fs.readFileSync(file, 'utf8')).filter((r) => r.company);
  db.transaction(() => {
    db.prepare('DELETE FROM companies').run();
    const ins = db.prepare('INSERT OR REPLACE INTO companies(name, priority, ats, careers_url, fit_notes, enabled, search_url, you_check, you_check_reason) VALUES (?,?,?,?,?,?,?,?,?)');
    for (const r of rows) ins.run(r.company, r.priority || '', r.ats || '', r.careers_url || '', r.fit_notes || '', r.enabled || 'yes', r.search_url || '', r.you_check || '', r.you_check_reason || '');
    // jobs imported before their company was known get its priority now
    const prio = priorityLookup(db);
    const upd = db.prepare('UPDATE jobs SET company_priority = ? WHERE id = ?');
    for (const j of db.prepare("SELECT id, company FROM jobs WHERE company_priority = ''").all() as { id: string; company: string }[]) {
      const p = prio(j.company); if (p) upd.run(p, j.id);
    }
  })();
  return rows.length;
}

export const PEOPLE_IMPORT_KEY = 'targets/people.csv';

export function importPeople(db: DB, repoRoot: string): number | null {
  if (isImported(db, PEOPLE_IMPORT_KEY)) return null;
  const file = path.join(repoRoot, 'targets', 'people.csv');
  const rows = fs.existsSync(file) ? parseCSV(fs.readFileSync(file, 'utf8')).filter((r) => r.name) : [];
  const at = nowIso();
  db.transaction(() => {
    const ins = db.prepare(`INSERT INTO contacts(id, name, company, title_or_lab, relationship, linkedin_url, email, email_source, email_confidence,
        work_summary, papers_json, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    for (const r of rows) {
      const rel = (RELATIONSHIPS as readonly string[]).includes(r.relationship) ? r.relationship : 'researcher';
      const handle = r.email_or_linkedin || '';
      const email = handle.includes('@') && !handle.includes('linkedin') ? handle : null;
      // Unknown provenance is treated as a guess, so the dashboard asks for an extra confirmation before sending.
      const confidence = email ? (/verified|official|homepage/i.test(r.email_source) ? 'verified' : /paper/i.test(r.email_source) ? 'from_paper' : 'pattern_guess') : null;
      ins.run(nextId(db, 'contacts'), r.name, r.company || '', r.team_or_lab || null, rel, email ? null : handle || null, email, r.email_source || null, confidence,
        r.paper_or_topic || null, '[]', [r.how_met && `How met: ${r.how_met}`, r.notes].filter(Boolean).join('\n') || null, at, at);
    }
    db.prepare('INSERT INTO imports(file, imported_at, rows) VALUES (?,?,?)').run(PEOPLE_IMPORT_KEY, at, rows.length);
  })();
  return rows.length;
}
