// The `runs` table: one row per Claude run (and per pipeline + its steps).
import { ID_RANGE, machineIdx, nextId, type DB } from '../db';
import { nowIso } from '../repo';
import type { Run, RunProgress, RunStatus } from '../../shared/types';
import { emptyProgress } from './stream';
import { isTaskId, TASKS } from './tasks';

type Row = Record<string, unknown>;
const parse = <T>(v: unknown, fb: T): T => { try { return v ? JSON.parse(String(v)) as T : fb; } catch { return fb; } };

export function rowToRun(r: Row): Run {
  const task = String(r.task);
  const def = isTaskId(task) ? TASKS[task] : null;
  const progress = parse<RunProgress>(r.progress_json, emptyProgress());
  return {
    id: Number(r.id), task, params: parse(r.params_json, {}), status: String(r.status) as RunStatus,
    created_at: String(r.created_at), started_at: (r.started_at as string) ?? null, finished_at: (r.finished_at as string) ?? null,
    pid: r.pid == null ? null : Number(r.pid), session_id: (r.session_id as string) ?? null, parent_id: r.parent_id == null ? null : Number(r.parent_id),
    progress: { ...emptyProgress(), ...progress, counters: { ...emptyProgress().counters, ...(progress.counters || {}) } },
    summary: (r.summary as string) ?? null, result_subtype: (r.result_subtype as string) ?? null,
    num_turns: r.num_turns == null ? null : Number(r.num_turns), usage_usd: r.usage_usd == null ? null : Number(r.usage_usd),
    error: (r.error as string) ?? null, label: def?.label || task, activity: def?.activity || task,
  };
}

export function insertRun(db: DB, task: string, params: Record<string, unknown>, opts: { parentId?: number | null; progress?: RunProgress } = {}): Run {
  const id = Number(db.prepare('INSERT INTO runs(id, task, params_json, status, created_at, parent_id, progress_json) VALUES (?,?,?,?,?,?,?)')
    .run(nextId(db, 'runs'), task, JSON.stringify(params), 'queued', nowIso(), opts.parentId ?? null, JSON.stringify(opts.progress || emptyProgress())).lastInsertRowid);
  return getRun(db, id);
}

export function getRun(db: DB, id: number): Run {
  const r = db.prepare('SELECT * FROM runs WHERE id = ?').get(id) as Row | undefined;
  if (!r) throw Object.assign(new Error(`No run ${id}`), { status: 404 });
  return rowToRun(r);
}

export function findRun(db: DB, id: number): Run | null {
  const r = db.prepare('SELECT * FROM runs WHERE id = ?').get(id) as Row | undefined;
  return r ? rowToRun(r) : null;
}

/** Top-level runs (pipeline steps are listed under their pipeline), newest first. */
export function listRuns(db: DB, opts: { limit?: number; parentId?: number } = {}): Run[] {
  const limit = Math.max(1, Math.min(500, Math.floor(opts.limit || 20)));
  const rows = opts.parentId != null
    ? db.prepare('SELECT * FROM runs WHERE parent_id = ? ORDER BY id ASC').all(opts.parentId)
    : db.prepare(`SELECT * FROM runs WHERE parent_id IS NULL ORDER BY id DESC LIMIT ${limit}`).all();
  return (rows as Row[]).map(rowToRun);
}

/** True when the run was made on this PC (its id is in this PC's range). */
export function ownsRun(db: DB, id: number): boolean {
  const lo = machineIdx(db) * ID_RANGE;
  return id > lo && id < lo + ID_RANGE;
}

/** This PC's queued/running runs (runs copied from the other PC are never started, stopped or recovered here). */
export function activeRuns(db: DB): Run[] {
  const lo = machineIdx(db) * ID_RANGE;
  return (db.prepare("SELECT * FROM runs WHERE status IN ('queued','running') AND id > ? AND id < ? ORDER BY id ASC").all(lo, lo + ID_RANGE) as Row[]).map(rowToRun);
}

export type RunPatch = Partial<{
  status: RunStatus; started_at: string | null; finished_at: string | null; pid: number | null; session_id: string | null;
  progress: RunProgress; summary: string | null; result_subtype: string | null; num_turns: number | null; usage_usd: number | null; error: string | null;
}>;

export function updateRun(db: DB, id: number, patch: RunPatch): Run {
  const cols: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    if (k === 'progress') cols.progress_json = JSON.stringify(v); else cols[k] = v;
  }
  const keys = Object.keys(cols);
  if (keys.length) db.prepare(`UPDATE runs SET ${keys.map((k) => `${k}=?`).join(', ')} WHERE id=?`).run(...keys.map((k) => cols[k]), id);
  return getRun(db, id);
}

const pidAlive = (pid: number | null) => {
  if (!pid) return false;
  try { process.kill(pid, 0); return true; } catch (e) { return (e as NodeJS.ErrnoException).code === 'EPERM'; }
};

/** On server start: a `running` run whose process is gone, or a leftover `queued` one, can't finish any more. */
export function recoverOrphans(db: DB, isAlive: (pid: number | null) => boolean = pidAlive): number {
  let n = 0;
  for (const r of activeRuns(db)) {
    if (r.status === 'running' && isAlive(r.pid)) continue;
    updateRun(db, r.id, {
      status: r.status === 'queued' ? 'cancelled' : 'failed', finished_at: nowIso(),
      error: r.status === 'queued' ? 'The dashboard was restarted before this run started. Start it again.' : 'The dashboard was restarted while this run was going, so it stopped.',
    });
    n++;
  }
  return n;
}

/** The last time a Chrome task finished successfully (preflight hint). */
export function lastChromeSuccess(db: DB): string | null {
  const chromeTasks = Object.values(TASKS).filter((t) => t.chrome).map((t) => `'${t.id}'`).join(',');
  const r = db.prepare(`SELECT finished_at FROM runs WHERE task IN (${chromeTasks}) AND status = 'succeeded' ORDER BY id DESC LIMIT 1`).get() as Row | undefined;
  return (r?.finished_at as string) ?? null;
}
