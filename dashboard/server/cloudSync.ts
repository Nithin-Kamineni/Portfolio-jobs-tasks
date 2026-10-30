// Two-way sync between the local dashboard database (SQLite) and the website's D1 database (site/, Cloudflare).
//
// jobs           two-way, field-level three-way merge against cloud_sync_base (each job's field hashes as of the last sync):
//                only one side changed a field → that side; both changed → the side with the newer updated_at (tie → local).
//                First sync (no base): local wins, except user fields (status, notes, dates, …) where the cloud row is newer and
//                differs; those cases are listed in the report. A cloud-only job whose id is a local alias (merged as a duplicate
//                here) is deleted in the cloud; any other cloud-only job is copied down.
// company_notes  two-way by company_key, newer updated_at wins.
// events         new events are copied to the other side with a new id; detail_json.sync_src = "local:<id>" / "cloud:<id>"
//                marks a copy, so nothing is copied twice or bounced back. undone_at is passed on as well.
// one-way        companies, contacts, runs, job_aliases, imports, settings, manual_checks, research_candidates,
//                paper_email_searches, outreach: local → cloud upserts of rows that changed since the last push (row hashes).
//
// The cloud is reached through wrangler (`d1 execute DB --remote`), run from site/; tests pass a fake D1.
import crypto from 'node:crypto';
import dns from 'node:dns';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { ID_RANGE, machineIdx, type DB } from './db';
import { descriptionDecision } from '../shared/description';
import { applyAliases } from './dedupe';

type Row = Record<string, unknown>;

// ---------------------------------------------------------------- the D1 side

export interface D1 {
  /** Runs read statements; one result list per statement. */
  query(sqls: string[]): Promise<Row[][]>;
  /** Runs a SQL script (writes). */
  exec(sql: string): Promise<void>;
}

const MAX_COMMAND = 24_000; // Windows command lines stop at 32k characters
const MAX_FILE = 900_000;   // bytes per SQL file sent with --file

/** The real D1 through wrangler (logged in with `wrangler login`). */
export function wranglerD1(siteDir: string, timeoutMs = 180_000): D1 {
  const bin = path.join(siteDir, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
  const run = (args: string[]) => new Promise<string>((resolve, reject) => {
    if (!fs.existsSync(bin)) { reject(new Error(`wrangler is not installed in ${siteDir} (run npm install there)`)); return; }
    const p = spawn(process.execPath, [bin, 'd1', 'execute', 'DB', '--remote', ...args], {
      cwd: siteDir, env: { ...process.env, CI: 'true', WRANGLER_SEND_METRICS: 'false', NO_COLOR: '1' }, windowsHide: true,
    });
    let out = ''; let err = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { err += d; });
    const timer = setTimeout(() => { p.kill(); reject(new Error(`wrangler timed out after ${Math.round(timeoutMs / 1000)} s`)); }, timeoutMs);
    p.on('error', (e) => { clearTimeout(timer); reject(e); });
    p.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(out);
      else reject(new Error(`wrangler failed (${code}): ${wranglerError(out, err)}`));
    });
  });
  return {
    async query(sqls) {
      const out: Row[][] = [];
      // Batch statements into commands that fit on a command line.
      let batch: string[] = []; let len = 0;
      const flush = async () => {
        if (!batch.length) return;
        const text = await run(['--json', '--command', batch.join(';\n')]);
        const parsed = parseJson(text) as { results?: Row[] }[] | { error?: unknown };
        if (!Array.isArray(parsed)) throw new Error(`wrangler: unexpected output ${text.slice(0, 300)}`);
        if (parsed.length !== batch.length) throw new Error(`wrangler: ${parsed.length} results for ${batch.length} statements`);
        for (const r of parsed) out.push(r.results || []);
        batch = []; len = 0;
      };
      for (const s of sqls) {
        if (len + s.length > MAX_COMMAND) await flush();
        batch.push(s); len += s.length + 2;
      }
      await flush();
      return out;
    },
    async exec(sql) {
      const file = path.join(os.tmpdir(), `jobwatcher-cloud-sync-${process.pid}-${Date.now()}.sql`);
      fs.writeFileSync(file, sql);
      try { await run(['--file', file, '--yes', '--json']); } finally { fs.rmSync(file, { force: true }); }
    },
  };
}

function parseJson(text: string): unknown {
  const i = text.search(/[[{]/);
  if (i < 0) throw new Error(`wrangler: no JSON in output: ${text.slice(0, 300)}`);
  return JSON.parse(text.slice(i));
}

function wranglerError(out: string, err: string): string {
  try {
    const j = parseJson(out) as { error?: { text?: string; notes?: { text?: string }[] } };
    if (j?.error) return [j.error.text, ...(j.error.notes || []).map((n) => n.text)].filter(Boolean).join(' ');
  } catch { /* plain text */ }
  const esc = String.fromCharCode(27);
  const lines = `${err}\n${out}`.split(/\r?\n/).map((l) => l.split(esc).map((p, i) => (i ? p.replace(/^\[[0-9;]*m/, '') : p)).join('').trim())
    .filter((l) => l && !/^(─|│|┌|└|├|▲|⛅|🌀)/u.test(l));
  return lines.slice(-4).join(' ').slice(0, 500) || 'no output';
}

/** True when the Cloudflare API host resolves (no point starting wrangler while offline). */
export async function online(timeoutMs = 4000): Promise<boolean> {
  return Promise.race([
    dns.promises.lookup('api.cloudflare.com').then(() => true, () => false),
    new Promise<boolean>((r) => setTimeout(() => r(false), timeoutMs).unref()),
  ]);
}

// ---------------------------------------------------------------- helpers

/** SQL literal (the same quoting as site/scripts/export-sqlite.mjs). */
export function lit(v: unknown): string {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (Buffer.isBuffer(v)) return `X'${v.toString('hex')}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
}
const ident = (s: string) => `"${s.replace(/"/g, '""')}"`;
const h = (v: unknown) => crypto.createHash('sha1').update(JSON.stringify(v ?? null)).digest('base64').slice(0, 8);
const rowHash = (r: Row, cols: string[]) => crypto.createHash('sha1').update(JSON.stringify(cols.map((c) => r[c] ?? null))).digest('base64').slice(0, 12);
const newer = (a: unknown, b: unknown) => String(a ?? '') > String(b ?? '');
const maxAt = (a: unknown, b: unknown) => (newer(b, a) ? b : a) ?? null;
const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** Fields the owner changes himself: on the first sync a newer cloud value of these wins over the local one. */
export const USER_FIELDS = ['status', 'decision_at', 'applied_date', 'outcome_date', 'notes', 'referral_requested_at', 'resume_version', 'application_dir'];

/**
 * Tables replicated between the PCs through the cloud (parents first). Each PC pushes its changed rows (row hashes) and
 * pulls the rows it lacks or that are newer in the cloud:
 *   ledger  rows are added, never conflict (the same key means the same thing): pull = rows missing locally.
 *   newer   pull/push wins by the `stamp` column (updated_at, checked_at, …): newer wins on both sides.
 *   owned   (runs) a row belongs to the PC whose id range holds its id: only the owner pushes it; others copy it.
 */
export type ReplicaMode = 'ledger' | 'newer' | 'owned';
export const ONE_WAY: { table: string; pk: string; order: string; mode: ReplicaMode; stamp?: string }[] = [
  { table: 'companies', pk: 'name', order: 'name', mode: 'ledger' },
  { table: 'contacts', pk: 'id', order: 'id', mode: 'newer', stamp: 'updated_at' },
  { table: 'runs', pk: 'id', order: 'id', mode: 'owned' },
  { table: 'job_aliases', pk: 'alias_id', order: 'alias_id', mode: 'ledger' },
  { table: 'imports', pk: 'file', order: 'file', mode: 'ledger' },
  { table: 'settings', pk: 'key', order: 'key', mode: 'ledger' },
  { table: 'manual_checks', pk: 'company', order: 'company', mode: 'newer', stamp: 'checked_at' },
  { table: 'research_candidates', pk: 'id', order: 'id', mode: 'newer', stamp: 'updated_at' },
  { table: 'paper_email_searches', pk: 'company_key', order: 'company_key', mode: 'newer', stamp: 'started_at' },
  { table: 'outreach', pk: 'id', order: 'id', mode: 'newer', stamp: 'updated_at' },
];
/** The cloud-side change marker each mode compares. */
const stampSql = (t: (typeof ONE_WAY)[number]) => (t.mode === 'owned' ? "status || '|' || COALESCE(finished_at, '') || '|' || length(progress_json)" : t.stamp ? t.stamp : "''");

/** Local tables a pull-all empties before copying everything from the cloud. */
const PULL_ALL_TABLES = ['outreach', 'research_candidates', 'contacts', 'events', 'job_aliases', 'company_notes', 'paper_email_searches', 'manual_checks',
  'imports', 'settings', 'runs', 'companies', 'jobs', 'cloud_sync_base', 'cloud_sync_pushed'];

export interface Machine { id: string; name: string }

/** Event kinds each side makes for itself (the status migration ran on both). */
const LOCAL_ONLY_EVENT_KINDS = new Set(['status_migrated']);

export function ensureSyncTables(db: DB): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cloud_sync_base(job_id TEXT PRIMARY KEY, cols_key TEXT NOT NULL, hashes TEXT NOT NULL, updated_at TEXT, synced_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS cloud_sync_pushed(tbl TEXT NOT NULL, pk TEXT NOT NULL, hash TEXT NOT NULL, PRIMARY KEY(tbl, pk));
    CREATE TABLE IF NOT EXISTS cloud_sync_state(key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `);
}

export function getState(db: DB, key: string): string | null {
  ensureSyncTables(db);
  return (db.prepare('SELECT value FROM cloud_sync_state WHERE key = ?').get(key) as { value: string } | undefined)?.value ?? null;
}
function setState(db: DB, key: string, value: string): void {
  db.prepare('INSERT INTO cloud_sync_state(key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value);
}

// ---------------------------------------------------------------- the merge (pure)

export interface Base { colsKey: string; hashes: Record<string, string>; updated_at: string | null }
export interface CloudWin { id: string; company: string; title: string; field: string; local: unknown; cloud: unknown; localUpdatedAt: unknown; cloudUpdatedAt: unknown }
export interface MergeResult {
  merged: Row;
  /** Columns to write locally / in the cloud (empty: that side already has the merged row). */
  toLocal: string[];
  toCloud: string[];
  conflicts: string[];
  cloudWins: CloudWin[];
}

/**
 * Three-way merge of one job present on both sides. `cloud` = null means the cloud row is unchanged since the base
 * (so equal to it) and wasn't downloaded.
 */
export function mergeJob(cols: string[], local: Row, cloud: Row | null, base: Base | null): MergeResult {
  const merged: Row = { ...local };
  const toLocal: string[] = []; const toCloud: string[] = []; const conflicts: string[] = []; const cloudWins: CloudWin[] = [];
  const cloudNewer = cloud ? newer(cloud.updated_at, local.updated_at) : false;
  for (const c of cols) {
    if (c === 'id' || c === 'updated_at') continue;
    if (!cloud) {
      // Cloud = base: local wins wherever it differs from the base.
      if (!base || base.hashes[c] !== h(local[c])) toCloud.push(c);
      continue;
    }
    if (same(local[c], cloud[c])) continue;
    const b = base?.hashes[c];
    let take: 'local' | 'cloud';
    if (b === undefined) {
      take = cloudNewer && USER_FIELDS.includes(c) ? 'cloud' : 'local';
      if (take === 'cloud') cloudWins.push({ id: String(local.id), company: String(local.company ?? ''), title: String(local.title ?? ''), field: c, local: local[c], cloud: cloud[c], localUpdatedAt: local.updated_at, cloudUpdatedAt: cloud.updated_at });
    } else {
      const lc = h(local[c]) !== b; const cc = h(cloud[c]) !== b;
      if (cc && !lc) take = 'cloud';
      else if (lc && !cc) take = 'local';
      else { conflicts.push(c); take = cloudNewer ? 'cloud' : 'local'; }
    }
    // A description is never lost: the side that would lose a substantial text to an empty/shorter/"gone" one keeps it.
    if (c === 'description') {
      if (take === 'cloud' && descriptionDecision(String(local[c] ?? ''), String(cloud[c] ?? '')).action === 'keep') take = 'local';
      else if (take === 'local' && descriptionDecision(String(cloud[c] ?? ''), String(local[c] ?? '')).action === 'keep') take = 'cloud';
    }
    if (take === 'cloud') { merged[c] = cloud[c]; toLocal.push(c); } else toCloud.push(c);
  }
  if (cloud) {
    merged.updated_at = maxAt(local.updated_at, cloud.updated_at);
    if (!same(merged.updated_at, local.updated_at) && toLocal.length) toLocal.push('updated_at');
    if (!same(merged.updated_at, cloud.updated_at) && toCloud.length) toCloud.push('updated_at');
  } else if (toCloud.length && !same(local.updated_at, base?.updated_at)) toCloud.push('updated_at');
  return { merged, toLocal, toCloud, conflicts, cloudWins };
}

/** Company notes: the newer updated_at wins (tie → local). */
export function mergeCompanyNotes(local: Row[], cloud: Row[]): { toLocal: Row[]; toCloud: Row[] } {
  const L = new Map(local.map((r) => [String(r.company_key), r]));
  const C = new Map(cloud.map((r) => [String(r.company_key), r]));
  const toLocal: Row[] = []; const toCloud: Row[] = [];
  for (const k of new Set([...L.keys(), ...C.keys()])) {
    const l = L.get(k); const c = C.get(k);
    if (l && !c) toCloud.push(l);
    else if (c && !l) toLocal.push(c);
    else if (l && c && !(same(l.note, c.note) && same(l.company, c.company) && same(l.updated_at, c.updated_at))) {
      if (newer(c.updated_at, l.updated_at)) toLocal.push(c); else toCloud.push(l);
    }
  }
  return { toLocal, toCloud };
}

// ---------------------------------------------------------------- the sync

export interface CloudSyncReport {
  ok: true;
  dry: boolean;
  at: string;
  ms: number;
  firstRun: boolean;
  jobs: { local: number; cloud: number; pushedNew: number; pulledNew: number; pushedUpdates: number; pulledUpdates: number; deletedInCloud: number; conflicts: number; downloaded: number; raced: number };
  cloudWins: CloudWin[];
  companyNotes: { pushed: number; pulled: number };
  events: { pushed: number; pulled: number; undonePushed: number; undonePulled: number };
  /** Replicated-table rows pushed (by table). */
  oneWay: Record<string, number>;
  /** Replicated-table rows copied from the cloud (by table). */
  pulled: Record<string, number>;
  /** This PC's index (id range) and whether the local data was replaced by the cloud's first. */
  machineIdx: number;
  pulledAll: boolean;
  /** Rows changed on either side (0 = both were already in sync). */
  changes: number;
  /** Rows changed locally (the page refreshes its lists when this is > 0). */
  localChanges: number;
}

export interface CloudSyncOptions {
  dry?: boolean;
  now?: () => string;
  /** This PC (registers it in the cloud's machines table and picks its id range). Tests may omit it (index 0). */
  machine?: Machine;
  /** Replace the local data with the cloud's (a new or stale PC). Also automatic on a second PC's first sync. */
  pullAll?: boolean;
}

/**
 * Registers this PC in the cloud (machines) and returns its index; the first PC gets 0 (the home PC, whose ids are
 * already in range 0), the next 1, …. A database that was synced as another PC refuses (copy-pasted data/ folder).
 */
export async function registerMachine(db: DB, d1: D1, m: Machine, at: string): Promise<number> {
  ensureSyncTables(db);
  const owner = getState(db, 'machine.id');
  if (owner && owner !== m.id) throw new Error(`This database was synced as PC "${owner}", but this PC is "${m.id}". Run "node dashboard/cli cloud-sync --pull-all" to start this PC from the website's data.`);
  const [, rows] = await d1.query([
    `INSERT INTO machines(id, name, idx, created_at, last_seen) SELECT ${lit(m.id)}, ${lit(m.name)}, COALESCE((SELECT max(idx) + 1 FROM machines), 0), ${lit(at)}, ${lit(at)} WHERE NOT EXISTS (SELECT 1 FROM machines WHERE id = ${lit(m.id)}) RETURNING idx`,
    `UPDATE machines SET name = ${lit(m.name)}, last_seen = ${lit(at)} WHERE id = ${lit(m.id)} RETURNING idx`,
  ]);
  const idx = Number(rows?.[0]?.idx);
  if (!Number.isInteger(idx) || idx < 0) throw new Error('Could not register this PC in the cloud database (machines table missing? run the site migrations)');
  const known = getState(db, 'machine.idx');
  if (known != null && Number(known) !== idx) throw new Error(`This PC was index ${known} but the cloud says ${idx}; run "node dashboard/cli cloud-sync --pull-all".`);
  setState(db, 'machine.id', m.id);
  setState(db, 'machine.idx', String(idx));
  return idx;
}

/** Empties the local data tables (kept: this PC's identity) so the next sync copies everything from the cloud. */
export function wipeLocalData(db: DB): void {
  ensureSyncTables(db);
  db.pragma('foreign_keys = OFF');
  try {
    db.transaction(() => {
      for (const t of PULL_ALL_TABLES) if (tableExists(db, t)) db.exec(`DELETE FROM ${t}`);
      db.exec("DELETE FROM cloud_sync_state WHERE key NOT LIKE 'machine.%'");
    })();
  } finally { db.pragma('foreign_keys = ON'); }
}

function columns(db: DB, table: string): string[] {
  return (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name);
}
function tableExists(db: DB, table: string): boolean {
  return Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table));
}
const chunk = <T>(a: T[], n: number): T[][] => { const out: T[][] = []; for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n)); return out; };

/** Splits statements into scripts of at most MAX_FILE bytes. */
function scripts(stmts: string[]): string[] {
  const out: string[] = []; let cur: string[] = []; let size = 0;
  for (const s of stmts) {
    const n = Buffer.byteLength(s) + 1;
    if (cur.length && size + n > MAX_FILE) { out.push(cur.join('\n')); cur = []; size = 0; }
    cur.push(s); size += n;
  }
  if (cur.length) out.push(cur.join('\n'));
  return out;
}

function withSyncSrc(detailJson: unknown, src: string): string {
  let d: unknown;
  try { d = JSON.parse(String(detailJson ?? '{}')); } catch { d = { raw: String(detailJson) }; }
  if (!d || typeof d !== 'object' || Array.isArray(d)) d = { value: d };
  return JSON.stringify({ ...(d as object), sync_src: src });
}
const syncSrc = (detailJson: unknown): string | null => {
  try { const d = JSON.parse(String(detailJson ?? '{}')); return d && typeof d.sync_src === 'string' ? d.sync_src : null; } catch { return null; }
};

export async function cloudSync(db: DB, d1: D1, opts: CloudSyncOptions = {}): Promise<CloudSyncReport> {
  const t0 = Date.now();
  const now = opts.now || (() => new Date().toISOString());
  const at = now();
  const dry = Boolean(opts.dry);
  ensureSyncTables(db);

  // ---- 0. this PC: its index (id range, event tag); a second PC's first sync starts from the cloud's data
  const idx = opts.machine ? await registerMachine(db, d1, opts.machine, at) : machineIdx(db);
  const neverSynced = getState(db, 'lastSuccessAt') == null && !(db.prepare('SELECT 1 FROM cloud_sync_base LIMIT 1').get());
  const pulledAll = Boolean(opts.pullAll || (idx > 0 && neverSynced));
  if (pulledAll && !dry) wipeLocalData(db);
  const lo = idx * ID_RANGE; const hi = lo + ID_RANGE;
  const mine = (id: unknown) => Number(id) > lo && Number(id) < hi;
  /** sync_src prefix of the events this PC pushes ("local" for the first PC, as before; "m1", … for the others). */
  const myTag = idx === 0 ? 'local' : `m${idx}`;
  const isMine = (detailJson: unknown) => Boolean(syncSrc(detailJson)?.startsWith(`${myTag}:`));

  const localJobCols = columns(db, 'jobs');
  const oneWay = ONE_WAY.filter((t) => tableExists(db, t.table));
  const lastAt = getState(db, 'lastSuccessAt');
  const undoneSince = lastAt ? new Date(Date.parse(lastAt) - 15 * 60_000).toISOString() : null;
  const firstEvents = getState(db, 'events.localMark') == null;
  const localMark = Number(getState(db, 'events.localMark') ?? 0);
  const cloudMark = Number(getState(db, 'events.cloudMark') ?? 0);

  // ---- 1. read the cloud (one wrangler call)
  const reads = [
    "SELECT name FROM pragma_table_info('jobs')",
    'SELECT id, updated_at FROM jobs',
    'SELECT company_key, company, note, updated_at FROM company_notes',
    firstEvents ? 'SELECT id, at, entity, entity_id, kind FROM events ORDER BY id' : 'SELECT max(id) AS id FROM events',
    // every new cloud event except this PC's own copies (website events, and the other PC's copies)
    `SELECT id, at, entity, entity_id, kind, detail_json, undone_at FROM events WHERE id > ${firstEvents ? 0 : cloudMark} AND detail_json NOT LIKE ${lit(`%"sync_src":"${myTag}:%`)} ORDER BY id`,
    undoneSince ? `SELECT id, undone_at, detail_json FROM events WHERE undone_at IS NOT NULL AND undone_at > ${lit(undoneSince)}` : 'SELECT 1 WHERE 0',
    ...oneWay.map((t) => `SELECT name FROM pragma_table_info('${t.table}')`),
    ...oneWay.map((t) => `SELECT ${ident(t.pk)} AS k, ${stampSql(t)} AS s FROM ${t.table}`),
  ];
  const res = await d1.query(reads);
  const cloudJobCols = new Set(res[0].map((r) => String(r.name)));
  if (!cloudJobCols.size) throw new Error('The cloud database has no jobs table (run the site migrations first)');
  const cols = localJobCols.filter((c) => cloudJobCols.has(c));
  const colsKey = h(cols);
  const cloudIndex = new Map(res[1].map((r) => [String(r.id), r.updated_at as string | null]));
  const cloudNotes = res[2];
  const cloudEventHeads = res[3];
  let cloudNewEvents = res[4];
  const cloudUndone = res[5];
  const cloudCols: Record<string, Set<string>> = {};
  oneWay.forEach((t, i) => { cloudCols[t.table] = new Set(res[6 + i].map((r) => String(r.name))); });
  const cloudKeys: Record<string, Map<string, string>> = {};
  oneWay.forEach((t, i) => { cloudKeys[t.table] = new Map(res[6 + oneWay.length + i].map((r) => [String(r.k), String(r.s ?? '')])); });

  // ---- 2. jobs: download the cloud rows that changed since the base
  // Duplicates merged on another PC arrive as job_aliases rows: merge them here too first, so both PCs keep the same row.
  if (!dry && tableExists(db, 'job_aliases')) applyAliases(db, at);
  const localRows = db.prepare(`SELECT ${cols.map(ident).join(', ')} FROM jobs`).all() as Row[];
  const local = new Map(localRows.map((r) => [String(r.id), r]));
  const baseRows = db.prepare('SELECT job_id, cols_key, hashes, updated_at FROM cloud_sync_base').all() as { job_id: string; cols_key: string; hashes: string; updated_at: string | null }[];
  const colsByKey = new Map<string, string[]>();
  const colsFor = (key: string) => {
    if (!colsByKey.has(key)) colsByKey.set(key, JSON.parse(getState(db, `jobs.cols:${key}`) || '[]'));
    return colsByKey.get(key)!;
  };
  const base = new Map<string, Base>();
  for (const b of baseRows) {
    const bc = colsFor(b.cols_key); const hashes: Record<string, string> = {};
    bc.forEach((c, i) => { hashes[c] = b.hashes.slice(i * 8, i * 8 + 8); });
    base.set(b.job_id, { colsKey: b.cols_key, hashes, updated_at: b.updated_at });
  }
  const firstRun = base.size === 0;
  const need = [...cloudIndex.keys()].filter((id) => {
    const b = base.get(id);
    return !b || b.updated_at !== cloudIndex.get(id) || !local.has(id);
  });
  const cloud = new Map<string, Row>();
  const selCols = cols.map(ident).join(', ');
  const fetchStmts = chunk(need, 60).map((ids) => `SELECT ${selCols} FROM jobs WHERE id IN (${ids.map(lit).join(',')})`);
  for (const group of chunk(fetchStmts, 4)) {
    for (const rows of await d1.query(group)) for (const r of rows) cloud.set(String(r.id), r);
  }

  const aliasRows = tableExists(db, 'job_aliases') ? db.prepare('SELECT alias_id, job_id FROM job_aliases').all() as { alias_id: string; job_id: string }[] : [];
  const aliasTarget = new Map(aliasRows.map((r) => [r.alias_id, r.job_id]));
  const aliases = new Set(aliasTarget.keys());
  /** Ids the cloud already knows as merged duplicates (from another PC): never pushed back as new jobs. */
  const cloudAliases = cloudKeys.job_aliases ?? new Map<string, string>();
  const report: CloudSyncReport = {
    ok: true, dry, at, ms: 0, firstRun,
    jobs: { local: local.size, cloud: cloudIndex.size, pushedNew: 0, pulledNew: 0, pushedUpdates: 0, pulledUpdates: 0, deletedInCloud: 0, conflicts: 0, downloaded: cloud.size, raced: 0 },
    cloudWins: [], companyNotes: { pushed: 0, pulled: 0 }, events: { pushed: 0, pulled: 0, undonePushed: 0, undonePulled: 0 }, oneWay: {}, pulled: {}, machineIdx: idx, pulledAll, changes: 0, localChanges: 0,
  };

  const cloudStmts: string[] = [];
  const localJobInserts: Row[] = [];
  const localJobUpdates: { id: string; seen: unknown; set: Row }[] = [];
  const newBase = new Map<string, { hashes: string; updated_at: unknown }>();
  const cloudWritten = new Map<string, unknown>(); // id → updated_at the cloud row should have afterwards
  const encode = (r: Row) => cols.map((c) => h(r[c])).join('');

  for (const [id, l] of local) {
    const seen = cloudIndex.get(id);
    if (!cloudIndex.has(id)) {
      if (aliases.has(id) || cloudAliases.has(id)) continue; // a merged duplicate (merged here on the next sync)
      cloudStmts.push(`INSERT INTO jobs(${cols.map(ident).join(', ')}) VALUES (${cols.map((c) => lit(l[c])).join(', ')}) ON CONFLICT(id) DO NOTHING;`);
      report.jobs.pushedNew++;
      newBase.set(id, { hashes: encode(l), updated_at: l.updated_at });
      cloudWritten.set(id, l.updated_at ?? null);
      continue;
    }
    const m = mergeJob(cols, l, cloud.get(id) ?? null, base.get(id) ?? null);
    report.cloudWins.push(...m.cloudWins);
    if (m.conflicts.length) report.jobs.conflicts++;
    if (m.toCloud.length) {
      cloudStmts.push(`UPDATE jobs SET ${m.toCloud.map((c) => `${ident(c)} = ${lit(m.merged[c])}`).join(', ')} WHERE id = ${lit(id)} AND updated_at IS ${lit(seen)};`);
      report.jobs.pushedUpdates++;
      cloudWritten.set(id, m.toCloud.includes('updated_at') ? m.merged.updated_at : seen);
    }
    if (m.toLocal.length) {
      localJobUpdates.push({ id, seen: l.updated_at, set: Object.fromEntries(m.toLocal.map((c) => [c, m.merged[c]])) });
      report.jobs.pulledUpdates++;
    }
    const b = base.get(id);
    const enc = encode(m.merged);
    if (!b || b.colsKey !== colsKey || cols.map((c) => b.hashes[c] ?? '').join('') !== enc || b.updated_at !== (m.merged.updated_at ?? null)) {
      newBase.set(id, { hashes: enc, updated_at: m.merged.updated_at });
    }
  }
  for (const id of cloudIndex.keys()) {
    if (local.has(id)) continue;
    if (aliases.has(id)) {
      cloudStmts.push(`DELETE FROM jobs WHERE id = ${lit(id)};`);
      cloudStmts.push(`UPDATE events SET entity_id = ${lit(aliasTarget.get(id))} WHERE entity = 'job' AND entity_id = ${lit(id)};`);
      report.jobs.deletedInCloud++;
      continue;
    }
    const c = cloud.get(id);
    if (!c) continue;
    localJobInserts.push(c);
    report.jobs.pulledNew++;
    newBase.set(id, { hashes: encode(c), updated_at: c.updated_at });
  }

  // ---- 3. company notes
  const localNotes = tableExists(db, 'company_notes') ? db.prepare('SELECT company_key, company, note, updated_at FROM company_notes').all() as Row[] : [];
  const notes = mergeCompanyNotes(localNotes, cloudNotes);
  for (const n of notes.toCloud) {
    cloudStmts.push(`INSERT INTO company_notes(company_key, company, note, updated_at) VALUES (${lit(n.company_key)}, ${lit(n.company)}, ${lit(n.note)}, ${lit(n.updated_at)}) ON CONFLICT(company_key) DO UPDATE SET company = excluded.company, note = excluded.note, updated_at = excluded.updated_at WHERE excluded.updated_at >= company_notes.updated_at;`);
  }
  report.companyNotes = { pushed: notes.toCloud.length, pulled: notes.toLocal.length };

  // ---- 4. events
  // First sync: both sides share the events of the original import (same ids). The marks start after the shared prefix.
  let lMark = localMark; let cMark = cloudMark;
  if (firstEvents) {
    const localHeads = new Map((db.prepare('SELECT id, at, entity_id, kind FROM events').all() as Row[]).map((r) => [Number(r.id), r]));
    let shared = 0;
    for (const c of cloudEventHeads) {
      const l = localHeads.get(Number(c.id));
      if (!l || l.at !== c.at || l.kind !== c.kind || (l.entity_id ?? null) !== (c.entity_id ?? null)) break;
      shared = Number(c.id);
    }
    lMark = shared; cMark = shared;
    cloudNewEvents = cloudNewEvents.filter((e) => Number(e.id) > shared);
  }
  const localNewEvents = db.prepare(`SELECT id, at, entity, entity_id, kind, detail_json, undone_at FROM events WHERE id > ? AND detail_json NOT LIKE '%"sync_src"%' ORDER BY id`).all(lMark) as Row[];
  const maxLocalEvent = Number((db.prepare('SELECT max(id) AS m FROM events').get() as { m: number | null }).m ?? 0);
  const maxCloudEvent = firstEvents ? Math.max(cMark, ...cloudEventHeads.map((r) => Number(r.id))) : Math.max(cMark, Number(cloudEventHeads[0]?.id ?? 0));
  for (const e of localNewEvents) {
    if (LOCAL_ONLY_EVENT_KINDS.has(String(e.kind))) continue;
    const src = `${myTag}:${e.id}`;
    cloudStmts.push(`INSERT INTO events(at, entity, entity_id, kind, detail_json, undone_at) SELECT ${lit(e.at)}, ${lit(e.entity)}, ${lit(e.entity_id)}, ${lit(e.kind)}, ${lit(withSyncSrc(e.detail_json, src))}, ${lit(e.undone_at)} WHERE NOT EXISTS (SELECT 1 FROM events WHERE detail_json LIKE ${lit(`%"sync_src":"${src}"%`)});`);
    report.events.pushed++;
  }
  const localEventInserts = cloudNewEvents.filter((e) => !LOCAL_ONLY_EVENT_KINDS.has(String(e.kind)) && !isMine(e.detail_json));
  report.events.pulled = localEventInserts.length;
  // undone_at both ways
  const undoneToCloud: string[] = [];
  if (undoneSince) {
    for (const e of db.prepare('SELECT id, undone_at, detail_json FROM events WHERE undone_at IS NOT NULL AND undone_at > ?').all(undoneSince) as Row[]) {
      const src = syncSrc(e.detail_json);
      if (src?.startsWith('cloud:')) undoneToCloud.push(`UPDATE events SET undone_at = ${lit(e.undone_at)} WHERE id = ${Number(src.slice(6))} AND undone_at IS NULL;`);
      else undoneToCloud.push(`UPDATE events SET undone_at = ${lit(e.undone_at)} WHERE undone_at IS NULL AND detail_json LIKE ${lit(`%"sync_src":"${myTag}:${e.id}"%`)};`);
    }
  }
  const undoneToLocal: { sql: string; args: unknown[] }[] = [];
  for (const e of cloudUndone) {
    const src = syncSrc(e.detail_json);
    if (src?.startsWith(`${myTag}:`)) undoneToLocal.push({ sql: 'UPDATE events SET undone_at = ? WHERE id = ? AND undone_at IS NULL', args: [e.undone_at, Number(src.slice(myTag.length + 1))] });
    else undoneToLocal.push({ sql: "UPDATE events SET undone_at = ? WHERE undone_at IS NULL AND detail_json LIKE ?", args: [e.undone_at, `%"sync_src":"cloud:${e.id}"%`] });
  }

  // ---- 5. replicated tables (see ONE_WAY): push this PC's changed rows, pull what the cloud has newer or this PC lacks
  const pushedHashes: { tbl: string; pk: string; hash: string }[] = [];
  const oldPushed = new Map((db.prepare('SELECT tbl, pk, hash FROM cloud_sync_pushed').all() as { tbl: string; pk: string; hash: string }[]).map((r) => [`${r.tbl}\u0000${r.pk}`, r.hash]));
  const oneWayStmts: string[] = [];
  const pullKeys: Record<string, string[]> = {};
  const pullCols: Record<string, string[]> = {};
  for (const t of oneWay) {
    const tc = columns(db, t.table).filter((c) => cloudCols[t.table].has(c));
    if (!tc.length || !tc.includes(t.pk)) continue;
    pullCols[t.table] = tc;
    const ck = cloudKeys[t.table];
    const localRows = db.prepare(`SELECT ${tc.map(ident).join(', ')}${t.mode === 'owned' ? `, ${stampSql(t)} AS __s` : ''} FROM ${t.table} ORDER BY ${t.order}`).all() as Row[];
    const localStamp = new Map(localRows.map((r) => [String(r[t.pk]), String((t.mode === 'owned' ? r.__s : t.stamp ? r[t.stamp] : '') ?? '')]));
    // pull: missing here, newer in the cloud, or (runs) another PC's run that changed
    const pull = [...ck.entries()].filter(([k, s]) => {
      if (!localStamp.has(k)) return t.mode !== 'owned' || !mine(k);
      if (t.mode === 'newer') return newer(s, localStamp.get(k));
      if (t.mode === 'owned') return !mine(k) && s !== localStamp.get(k);
      return false;
    }).map(([k]) => k);
    pullKeys[t.table] = pull;
    const pulling = new Set(pull);
    let n = 0;
    for (const r of localRows) {
      const key = String(r[t.pk]);
      const pk = JSON.stringify([r[t.pk]]);
      const hash = rowHash(r, tc);
      if (oldPushed.get(`${t.table}\u0000${pk}`) === hash) continue;
      if (pulling.has(key)) continue; // the cloud's copy is newer: it comes down instead
      if (t.mode === 'owned' && !mine(key)) continue; // another PC's run: only its owner pushes it
      if (t.table === 'research_candidates') oneWayStmts.push(`DELETE FROM research_candidates WHERE openalex_id = ${lit(r.openalex_id)} AND id <> ${lit(r.id)};`);
      const upd = tc.filter((c) => c !== t.pk);
      const when = t.mode === 'newer' && t.stamp ? ` WHERE excluded.${ident(t.stamp)} >= ${t.table}.${ident(t.stamp)}` : '';
      oneWayStmts.push(`INSERT INTO ${t.table}(${tc.map(ident).join(', ')}) VALUES (${tc.map((c) => lit(r[c])).join(', ')}) ON CONFLICT(${ident(t.pk)}) DO ${upd.length ? `UPDATE SET ${upd.map((c) => `${ident(c)} = excluded.${ident(c)}`).join(', ')}${when}` : 'NOTHING'};`);
      pushedHashes.push({ tbl: t.table, pk, hash });
      n++;
    }
    if (n) report.oneWay[t.table] = n;
  }
  // download the rows to pull
  const pulledRows: Record<string, Row[]> = {};
  const pullStmts: { table: string; sql: string }[] = [];
  for (const t of oneWay) {
    const keys = pullKeys[t.table] || [];
    const tc = pullCols[t.table];
    if (!keys.length || !tc) continue;
    const asKey = (k: string) => (t.pk === 'id' ? Number(k) : k);
    for (const ks of chunk(keys, 80)) pullStmts.push({ table: t.table, sql: `SELECT ${tc.map(ident).join(', ')} FROM ${t.table} WHERE ${ident(t.pk)} IN (${ks.map((k) => lit(asKey(k))).join(',')}) ORDER BY ${t.order}` });
  }
  for (const group of chunk(pullStmts, 4)) {
    const out = await d1.query(group.map((g) => g.sql));
    group.forEach((g, i) => { (pulledRows[g.table] ||= []).push(...out[i]); });
  }
  report.pulled = Object.fromEntries(Object.entries(pulledRows).map(([k, v]) => [k, v.length]).filter(([, v]) => Number(v) > 0));

  report.events.undonePushed = undoneToCloud.length;
  report.events.undonePulled = undoneToLocal.length;
  report.changes = report.jobs.pushedNew + report.jobs.pulledNew + report.jobs.pushedUpdates + report.jobs.pulledUpdates + report.jobs.deletedInCloud
    + report.companyNotes.pushed + report.companyNotes.pulled + report.events.pushed + report.events.pulled
    + Object.values(report.oneWay).reduce((a, b) => a + b, 0) + Object.values(report.pulled).reduce((a, b) => a + b, 0);
  report.localChanges = report.jobs.pulledNew + report.jobs.pulledUpdates + report.companyNotes.pulled + report.events.pulled
    + Object.values(report.pulled).reduce((a, b) => a + b, 0);
  if (dry) { report.ms = Date.now() - t0; return report; }

  // ---- 6. write the cloud: jobs first (outreach refers to them), then the one-way tables (parents first).
  const all = [...cloudStmts, ...oneWayStmts, ...undoneToCloud];
  for (const s of scripts(all)) await d1.exec(s);

  // A website edit between our read and our write makes the conditional UPDATE skip: keep the old base for those
  // rows, so the next sync merges them again.
  const raced = new Set<string>();
  const verifyIds = [...cloudWritten.keys()];
  const seenIds = new Set<string>();
  for (const group of chunk(chunk(verifyIds, 150).map((ids) => `SELECT id, updated_at FROM jobs WHERE id IN (${ids.map(lit).join(',')})`), 4)) {
    for (const rows of await d1.query(group)) for (const r of rows) { seenIds.add(String(r.id)); if (!same(r.updated_at, cloudWritten.get(String(r.id)))) raced.add(String(r.id)); }
  }
  for (const id of verifyIds) if (!seenIds.has(id)) raced.add(id);

  // ---- 7. write locally (one transaction; foreign keys off: copied rows may arrive before what they point to)
  db.pragma('foreign_keys = OFF');
  try {
  db.transaction(() => {
    if (localJobInserts.length) {
      const ins = db.prepare(`INSERT OR IGNORE INTO jobs(${cols.map(ident).join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`);
      for (const r of localJobInserts) ins.run(...cols.map((c) => r[c] ?? null));
    }
    for (const u of localJobUpdates) {
      const keys = Object.keys(u.set);
      const r = db.prepare(`UPDATE jobs SET ${keys.map((k) => `${ident(k)} = ?`).join(', ')} WHERE id = ? AND updated_at IS ?`).run(...keys.map((k) => u.set[k] ?? null), u.id, u.seen ?? null);
      if (r.changes === 0) raced.add(u.id);
    }
    const putBase = db.prepare('INSERT INTO cloud_sync_base(job_id, cols_key, hashes, updated_at, synced_at) VALUES (?,?,?,?,?) ON CONFLICT(job_id) DO UPDATE SET cols_key = excluded.cols_key, hashes = excluded.hashes, updated_at = excluded.updated_at, synced_at = excluded.synced_at');
    for (const [id, b] of newBase) if (!raced.has(id)) putBase.run(id, colsKey, b.hashes, (b.updated_at as string | null) ?? null, at);
    setState(db, `jobs.cols:${colsKey}`, JSON.stringify(cols));
    for (const id of cloudIndex.keys()) if (aliases.has(id) && !local.has(id)) db.prepare('DELETE FROM cloud_sync_base WHERE job_id = ?').run(id);

    const putNote = db.prepare(`INSERT INTO company_notes(company_key, company, note, updated_at) VALUES (?,?,?,?)
      ON CONFLICT(company_key) DO UPDATE SET company = excluded.company, note = excluded.note, updated_at = excluded.updated_at`);
    for (const n of notes.toLocal) putNote.run(n.company_key, n.company, n.note ?? '', n.updated_at);

    const insEvent = db.prepare(`INSERT INTO events(at, entity, entity_id, kind, detail_json, undone_at)
      SELECT ?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM events WHERE detail_json LIKE ?)`);
    for (const e of localEventInserts) {
      const src = `cloud:${e.id}`;
      insEvent.run(e.at, e.entity, e.entity_id ?? null, e.kind, withSyncSrc(e.detail_json, src), e.undone_at ?? null, `%"sync_src":"${src}"%`);
    }
    for (const u of undoneToLocal) db.prepare(u.sql).run(...u.args);

    const putPushed = db.prepare('INSERT INTO cloud_sync_pushed(tbl, pk, hash) VALUES (?,?,?) ON CONFLICT(tbl, pk) DO UPDATE SET hash = excluded.hash');
    for (const p of pushedHashes) putPushed.run(p.tbl, p.pk, p.hash);
    // copies from the cloud (and their hashes, so they are not pushed back)
    for (const t of oneWay) {
      const rows = pulledRows[t.table];
      const tc = pullCols[t.table];
      if (!rows?.length || !tc) continue;
      const upd = tc.filter((c) => c !== t.pk);
      const put = db.prepare(`INSERT INTO ${t.table}(${tc.map(ident).join(', ')}) VALUES (${tc.map(() => '?').join(', ')}) ON CONFLICT(${ident(t.pk)}) DO ${upd.length ? `UPDATE SET ${upd.map((c) => `${ident(c)} = excluded.${ident(c)}`).join(', ')}` : 'NOTHING'}`);
      for (const r of rows) {
        // the same researcher already found here under another id: keep the local row
        if (t.table === 'research_candidates' && db.prepare('SELECT 1 FROM research_candidates WHERE openalex_id = ? AND id <> ?').get(r.openalex_id, r.id)) continue;
        put.run(...tc.map((c) => r[c] ?? null));
        putPushed.run(t.table, JSON.stringify([r[t.pk]]), rowHash(r, tc));
      }
    }

    setState(db, 'events.localMark', String(maxLocalEvent));
    setState(db, 'events.cloudMark', String(maxCloudEvent));
    setState(db, 'lastSuccessAt', at);
    if (report.localChanges) setState(db, 'lastPullAt', at);
  })();
  } finally { db.pragma('foreign_keys = ON'); }
  // aliases that just came down from another PC: merge now (the merged rows go up on the next sync)
  if (tableExists(db, 'job_aliases') && applyAliases(db, at).length) { report.localChanges++; setState(db, 'lastPullAt', at); }
  report.jobs.raced = raced.size;
  report.ms = Date.now() - t0;
  return report;
}

// ---------------------------------------------------------------- status (header) and the automatic loop

export interface CloudSyncStatus {
  enabled: boolean;
  running: boolean;
  /** Last attempt (ok or not). */
  lastAt: string | null;
  lastOk: boolean | null;
  lastError: string | null;
  lastSuccessAt: string | null;
  lastChanges: number | null;
  /** Last time a sync changed local rows (the page refetches its lists when this moves). */
  lastPullAt: string | null;
}

export function readStatus(db: DB, enabled: boolean, running = false): CloudSyncStatus {
  const s = (k: string) => getState(db, k);
  return {
    enabled, running,
    lastAt: s('lastAt'), lastOk: s('lastOk') == null ? null : s('lastOk') === '1', lastError: s('lastError') || null,
    lastSuccessAt: s('lastSuccessAt'), lastChanges: s('lastChanges') == null ? null : Number(s('lastChanges')), lastPullAt: s('lastPullAt'),
  };
}

function recordAttempt(db: DB, at: string, ok: boolean, error: string | null, changes: number | null): void {
  ensureSyncTables(db);
  db.transaction(() => {
    setState(db, 'lastAt', at);
    setState(db, 'lastOk', ok ? '1' : '0');
    setState(db, 'lastError', error || '');
    if (changes != null) setState(db, 'lastChanges', String(changes));
  })();
}

/** One sync with bookkeeping (status row, offline check). Throws on failure after recording it. */
export async function runCloudSync(db: DB, d1: D1, opts: CloudSyncOptions & { checkOnline?: boolean } = {}): Promise<CloudSyncReport> {
  const at = new Date().toISOString();
  try {
    if (opts.checkOnline !== false && !(await online())) throw new Error('offline (api.cloudflare.com does not resolve)');
    const r = await cloudSync(db, d1, opts);
    if (!opts.dry) recordAttempt(db, at, true, null, r.changes);
    return r;
  } catch (e) {
    if (!opts.dry) recordAttempt(db, at, false, (e as Error).message.slice(0, 500), null);
    throw e;
  }
}

export interface SchedulerOptions {
  /** This PC (cloud registration, id range). */
  machine?: Machine;
  intervalMinutes: number;
  debounceSeconds: number;
  /** Called after a sync that changed local rows (regenerate tracker.csv). */
  onLocalChanges?: () => void;
  log?: (m: string) => void;
}

/**
 * The dashboard's automatic cloud sync: every `intervalMinutes`, `debounceSeconds` after a local change (API writes, CLI
 * writes seen through PRAGMA data_version, imports) and right after a git Sync. One at a time; failures are logged and
 * retried on the next tick.
 */
export class CloudSyncScheduler {
  running = false;
  private again = false;
  private debounce: NodeJS.Timeout | null = null;
  private timers: NodeJS.Timeout[] = [];
  private dataVersion = 0;
  private stopped = false;

  constructor(private db: DB, private d1: D1, private opts: SchedulerOptions) {}

  start(firstDelayMs = 15_000): void {
    this.dataVersion = this.readDataVersion();
    const first = setTimeout(() => { void this.now(); }, firstDelayMs); first.unref();
    const tick = setInterval(() => { void this.now(); }, Math.max(1, this.opts.intervalMinutes) * 60_000); tick.unref();
    // Writes from other processes (the CLI inside Claude runs, `cli rank`, `cli sync`) change data_version.
    const watch = setInterval(() => {
      const v = this.readDataVersion();
      if (v !== this.dataVersion) { this.dataVersion = v; this.changed(); }
    }, 5_000); watch.unref();
    this.timers.push(first, tick, watch);
  }

  stop(): void {
    this.stopped = true;
    for (const t of this.timers) { clearTimeout(t); clearInterval(t); }
    if (this.debounce) clearTimeout(this.debounce);
  }

  /** A local change: sync once things have been quiet for debounceSeconds. */
  changed(): void {
    if (this.stopped) return;
    if (this.debounce) clearTimeout(this.debounce);
    this.debounce = setTimeout(() => { this.debounce = null; void this.now(); }, this.opts.debounceSeconds * 1000);
    this.debounce.unref();
  }

  /** Sync now (or right after the running one). */
  async now(): Promise<CloudSyncReport | null> {
    if (this.stopped) return null;
    if (this.running) { this.again = true; return null; }
    this.running = true;
    try {
      const r = await runCloudSync(this.db, this.d1, { machine: this.opts.machine });
      if (r.changes) this.opts.log?.(`Cloud sync: ${r.changes} change(s) (${r.localChanges} local) in ${r.ms} ms`);
      if (r.localChanges) this.opts.onLocalChanges?.();
      return r;
    } catch (e) {
      this.opts.log?.(`Cloud sync failed: ${(e as Error).message}`);
      return null;
    } finally {
      this.running = false;
      this.dataVersion = this.readDataVersion();
      if (this.again && !this.stopped) { this.again = false; setTimeout(() => { void this.now(); }, 1000).unref(); }
    }
  }

  private readDataVersion(): number {
    try { return Number(this.db.pragma('data_version', { simple: true })); } catch { return 0; }
  }
}

// A process-wide hook so the API layer and git Sync can report changes without knowing about the scheduler.
let active: CloudSyncScheduler | null = null;
export const setActiveScheduler = (s: CloudSyncScheduler | null) => { active = s; };
export const activeScheduler = () => active;
/** A local change happened (debounced sync). */
export const notifyLocalChange = () => { active?.changed(); };
/** Sync right away (after a git Sync/import). */
export const syncSoon = () => { if (active) void active.now(); };
