// SQLite database: schema, migrations (PRAGMA user_version) and daily backups.
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

export type DB = Database.Database;

/** Each entry upgrades the schema by one version. Never edit a shipped migration; append a new one. */
const MIGRATIONS: string[] = [
  `
  CREATE TABLE jobs(
    id TEXT PRIMARY KEY,
    company TEXT NOT NULL DEFAULT '', company_priority TEXT NOT NULL DEFAULT '', title TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '', url TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT '', ats TEXT NOT NULL DEFAULT '', posted_date TEXT NOT NULL DEFAULT '', posted_raw TEXT NOT NULL DEFAULT '',
    first_seen TEXT NOT NULL DEFAULT '',
    score INTEGER, hits_json TEXT NOT NULL DEFAULT '[]', tags_json TEXT NOT NULL DEFAULT '[]', flags_json TEXT NOT NULL DEFAULT '[]',
    degrees TEXT NOT NULL DEFAULT '', sponsorship_flag TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '', description_fetched_at TEXT,
    fit_score INTEGER, fit_reason TEXT, ranked_at TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    decision_at TEXT, applied_date TEXT, outcome_date TEXT,
    resume_version TEXT NOT NULL DEFAULT 'master', application_dir TEXT, notes TEXT,
    referral_requested_at TEXT,
    updated_at TEXT
  );
  CREATE INDEX jobs_status ON jobs(status);
  CREATE INDEX jobs_company ON jobs(company);

  CREATE TABLE contacts(
    id INTEGER PRIMARY KEY, name TEXT NOT NULL, company TEXT NOT NULL DEFAULT '', title_or_lab TEXT,
    relationship TEXT NOT NULL DEFAULT 'researcher',
    linkedin_url TEXT, email TEXT, email_source TEXT, email_confidence TEXT,
    work_summary TEXT, papers_json TEXT NOT NULL DEFAULT '[]',
    notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE INDEX contacts_company ON contacts(company);

  CREATE TABLE outreach(
    id INTEGER PRIMARY KEY, type TEXT NOT NULL,
    contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
    job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
    channel TEXT, subject TEXT, body TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    sent_at TEXT, follow_up_due TEXT, reply_notes TEXT,
    parent_id INTEGER REFERENCES outreach(id) ON DELETE SET NULL,
    created_by TEXT NOT NULL DEFAULT 'claude', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE INDEX outreach_status ON outreach(status);

  CREATE TABLE events(id INTEGER PRIMARY KEY, at TEXT NOT NULL, entity TEXT NOT NULL, entity_id TEXT, kind TEXT NOT NULL, detail_json TEXT NOT NULL DEFAULT '{}', undone_at TEXT);
  CREATE INDEX events_entity ON events(entity, entity_id);
  CREATE INDEX events_kind ON events(kind);

  CREATE TABLE imports(file TEXT PRIMARY KEY, imported_at TEXT NOT NULL, rows INTEGER NOT NULL);

  CREATE TABLE companies(name TEXT PRIMARY KEY, priority TEXT, ats TEXT, careers_url TEXT, fit_notes TEXT, enabled TEXT);
  `,
  // v2 P1: headless Claude Code runs started from the dashboard (plan_dashboard_v2 §3.4).
  // parent_id links the steps of a pipeline run ("Process new jobs") to the pipeline row.
  `
  CREATE TABLE runs(
    id INTEGER PRIMARY KEY, task TEXT NOT NULL, params_json TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL,
    created_at TEXT NOT NULL, started_at TEXT, finished_at TEXT,
    pid INTEGER, session_id TEXT, parent_id INTEGER REFERENCES runs(id) ON DELETE SET NULL,
    progress_json TEXT NOT NULL DEFAULT '{}',
    summary TEXT, result_subtype TEXT, num_turns INTEGER, usage_usd REAL, error TEXT
  );
  CREATE INDEX runs_status ON runs(status);
  CREATE INDEX runs_parent ON runs(parent_id);
  `,
  // v2 P3: settings the owner changes in the dashboard (e.g. "Commit and push automatically"); defaults come from config.json.
  `
  CREATE TABLE settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `,
  // v2 P4: staged ranking, manual-company checks, exact-duplicate merging and re-post links (plan §3.8, §3.9, §4).
  `
  ALTER TABLE jobs ADD COLUMN rank_stage TEXT;             -- rule | quick | final (null: ranked before v2, or not ranked)
  ALTER TABLE jobs ADD COLUMN rank_model TEXT;             -- which model (or "rules") wrote the fit score
  ALTER TABLE jobs ADD COLUMN canonical_url TEXT;          -- URL without tracking parameters: the same posting from two sources
  ALTER TABLE jobs ADD COLUMN req_id TEXT;                 -- requisition number from the URL/id (Workday JR…, Greenhouse id, …)
  ALTER TABLE jobs ADD COLUMN repost_key TEXT;             -- companyKey + normalized title: a re-posted role
  ALTER TABLE jobs ADD COLUMN previous_posting_id TEXT;    -- the older posting of the same role (never hidden)
  CREATE INDEX jobs_canonical ON jobs(canonical_url);
  CREATE INDEX jobs_repost ON jobs(repost_key);
  CREATE TABLE job_aliases(alias_id TEXT PRIMARY KEY, job_id TEXT NOT NULL, reason TEXT NOT NULL, at TEXT NOT NULL);
  CREATE TABLE manual_checks(company TEXT PRIMARY KEY, checked_at TEXT, result TEXT, found INTEGER, added INTEGER, note TEXT);
  ALTER TABLE companies ADD COLUMN search_url TEXT;
  `,
  // v2 P6: researcher finding from OpenAlex (+ Semantic Scholar) and LinkedIn links confirmed by the owner (plan §6).
  `
  ALTER TABLE contacts ADD COLUMN linkedin_confidence TEXT;   -- search_match | confirmed | rejected (null: none, or entered by the owner)
  ALTER TABLE contacts ADD COLUMN linkedin_source TEXT;       -- e.g. "web search: 'Jane Doe NVIDIA LinkedIn'"
  ALTER TABLE contacts ADD COLUMN linkedin_rejected TEXT;     -- the link the owner said was the wrong person (never suggested again)
  ALTER TABLE contacts ADD COLUMN openalex_id TEXT;           -- OpenAlex author id (A…): the same researcher across runs
  CREATE INDEX contacts_openalex ON contacts(openalex_id);
  CREATE TABLE research_candidates(
    id INTEGER PRIMARY KEY, openalex_id TEXT NOT NULL UNIQUE, name TEXT NOT NULL, company TEXT NOT NULL,
    institution TEXT, country TEXT, papers_json TEXT NOT NULL DEFAULT '[]', topics_json TEXT NOT NULL DEFAULT '[]',
    score REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'new',                        -- new | picked | skipped | contacted
    contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
    first_seen TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE INDEX research_candidates_status ON research_candidates(status);
  `,
  // v2 P5: semi-automated application filling in Chrome (plan §5). Claude stops before Submit; the owner checks and submits.
  `
  ALTER TABLE jobs ADD COLUMN fill_status TEXT;   -- ready_for_review | needs_user | failed (null: never filled)
  ALTER TABLE jobs ADD COLUMN fill_report TEXT;   -- applications/<dir>/fill_report.md
  ALTER TABLE jobs ADD COLUMN fill_at TEXT;
  `,
  // 2026-10-17 simplified statuses (The owner): applying is manual, so "prepared" and "apply_direct" are gone (→ applied),
  // the Rejected and Offer phases are gone (rejected → applied, offer → interview; a note keeps what it was).
  // "closed" (posting gone) stays and is hidden. Each moved job gets a status_migrated event (a trail, not undoable).
  // Also: one note per company (company_notes) and the cached "Find R&D emails from papers" results (paper_email_searches).
  `
  INSERT INTO events(at, entity, entity_id, kind, detail_json)
    SELECT strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 'job', id, 'status_migrated',
      json_object('from', status, 'to', CASE status WHEN 'offer' THEN 'interview' ELSE 'applied' END, 'by', 'migration v7')
    FROM jobs WHERE status IN ('prepared', 'apply_direct', 'rejected', 'offer');
  UPDATE jobs SET applied_date = COALESCE(applied_date, substr(COALESCE(decision_at, updated_at, first_seen), 1, 10)),
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE status IN ('prepared', 'apply_direct');
  UPDATE jobs SET status = 'applied' WHERE status IN ('prepared', 'apply_direct');
  UPDATE jobs SET status = 'applied', applied_date = COALESCE(applied_date, substr(COALESCE(decision_at, updated_at, first_seen), 1, 10)),
      notes = COALESCE(notes || char(10), '') || '[' || date('now', 'localtime') || '] Was "Rejected" (that phase was removed; it stays in Applied).',
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE status = 'rejected';
  UPDATE jobs SET status = 'interview',
      notes = COALESCE(notes || char(10), '') || '[' || date('now', 'localtime') || '] Was "Offer" (that phase was removed; it stays in Interview).',
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE status = 'offer';
  CREATE TABLE company_notes(
    company_key TEXT PRIMARY KEY,           -- companyKey(name): "NVIDIA" and "NVIDIA Corporation" share one note
    company TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL
  );
  CREATE TABLE paper_email_searches(
    company_key TEXT PRIMARY KEY, company TEXT NOT NULL,
    status TEXT NOT NULL,                   -- running | done | error
    started_at TEXT NOT NULL, finished_at TEXT,
    result_json TEXT NOT NULL DEFAULT '{}', error TEXT
  );
  `,
  // 2026-10-17 "Check these yourself" (Home): companies whose career sites even the Chrome check cannot read
  // (targets/companies.csv you_check / you_check_reason). An "I checked" click is a 'self_checked' event.
  `
  ALTER TABLE companies ADD COLUMN you_check TEXT;
  ALTER TABLE companies ADD COLUMN you_check_reason TEXT;
  `,
];

export const SCHEMA_VERSION = MIGRATIONS.length;

export function migrate(db: DB): void {
  const current = db.pragma('user_version', { simple: true }) as number;
  for (let v = current; v < MIGRATIONS.length; v++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[v]);
      db.pragma(`user_version = ${v + 1}`);
    })();
  }
}

/** Each PC creates ids only in its own range (see cloudSync.ts: machines). */
export const ID_RANGE = 1_000_000_000;

/** This PC's index (0 = the first PC registered with the website database, the home PC). */
export function machineIdx(db: DB): number {
  try {
    const r = db.prepare("SELECT value FROM cloud_sync_state WHERE key = 'machine.idx'").get() as { value: string } | undefined;
    return r ? Number(r.value) || 0 : 0;
  } catch { return 0; } // no cloud sync yet
}

/**
 * The next id for a new row in a table whose rows are shared between PCs (runs, contacts, outreach, research_candidates):
 * one more than the largest id in this PC's range [idx·1e9 + 1, (idx + 1)·1e9). Rows copied from the other PC keep their
 * ids (in its range), so ids never collide and the same row has the same id everywhere.
 */
export function nextId(db: DB, table: 'runs' | 'contacts' | 'outreach' | 'research_candidates'): number {
  const lo = machineIdx(db) * ID_RANGE;
  const r = db.prepare(`SELECT max(id) AS m FROM ${table} WHERE id > ? AND id <= ?`).get(lo, lo + ID_RANGE - 1) as { m: number | null };
  return (r.m ?? lo) + 1;
}

/** Opens (and creates) the database in WAL mode, so the CLI can write while the dashboard is open. */
export function openDb(file: string): DB {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}

/**
 * Makes today's backup (data/backups/jobwatcher-YYYY-MM-DD.db) if it doesn't exist yet,
 * then deletes all but the newest `keep` backups. Returns the backup path, or null if today's already existed.
 */
export async function dailyBackup(db: DB, dir: string, keep = 14, now = new Date()): Promise<string | null> {
  fs.mkdirSync(dir, { recursive: true });
  const day = localDate(now);
  const target = path.join(dir, `jobwatcher-${day}.db`);
  let made: string | null = null;
  if (!fs.existsSync(target)) { await db.backup(target); made = target; }
  const all = fs.readdirSync(dir).filter((f) => /^jobwatcher-\d{4}-\d{2}-\d{2}\.db$/.test(f)).sort();
  for (const f of all.slice(0, Math.max(0, all.length - keep))) fs.rmSync(path.join(dir, f), { force: true });
  return made;
}

/** YYYY-MM-DD in local time (follow-up dates and "today" are local-calendar concepts). */
export function localDate(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return localDate(new Date(y, m - 1, d + n));
}
