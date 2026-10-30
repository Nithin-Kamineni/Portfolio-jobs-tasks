// The website's PC queue: buttons on the website that need this PC (Claude runs, git Sync, Fetch description, Find R&D
// emails from papers) insert a row in D1's run_requests (site/migrations/0017_run_requests.sql). The dashboard polls it
// through wrangler, claims a request atomically (UPDATE … WHERE status='queued' RETURNING), runs it through the same
// code as its own buttons and writes the outcome back. A heartbeat row tells the website whether the PC is on.
//
//   queued → claimed → started → done | failed      (cancelled: by the website while still queued)
//
// Claude runs and git Sync wait until the RunManager is idle (one run at a time); the request stays queued until then.
// While a run is going its runs row (and its pipeline steps) is pushed to D1 every few seconds so the website shows the
// progress; when it ends a full cloud sync runs first, so "done" means the results are on the website.
import { getState, lit, online, type D1 } from './cloudSync';
import { sync, type Ctx } from './sync';
import { getJob, setDescription } from './repo';
import { getPaperEmailSearch, paperEmailSearchDone, startPaperEmailSearch } from './research/paperEmails';
import { fetchDescription } from '../../watcher/lib/describe.js';
import type { RunManager } from './runs/runner';
import type { CloudSyncScheduler } from './cloudSync';
import { EXCLUSIVE_TASKS, setRemoteGuard } from './runs/remoteGuard';
import { ownsRun } from './runs/store';

type Row = Record<string, unknown>;

export const REQUEST_KINDS = ['run', 'sync', 'fetch-description', 'paper-emails', 'cancel-run'] as const;
export type RequestKind = (typeof REQUEST_KINDS)[number];

export interface RunRequest {
  id: number;
  kind: RequestKind;
  task: string | null;
  params: Record<string, unknown>;
  status: string;
  local_run_id: number | null;
}

export interface RunInfo { id: number; status: string; error?: string | null; summary?: string | null; counters?: Record<string, number> }

/** What the poller does on this PC. The real one (localActions) calls the dashboard's own code; tests pass fakes. */
export interface RequestActions {
  /** False until this PC is registered with the cloud (its id range is known): the poller waits. */
  ready?(): boolean;
  /** Nothing queued or running in the RunManager. */
  idle(): boolean;
  /** The top-level run that is running now (for the heartbeat). */
  currentRun(): { id: number; task: string } | null;
  /** The run was made on this PC (cancel-run requests go to the PC that owns the run). */
  ownsRun(id: number): boolean;
  /** Starts a Claude run like the dashboard's buttons (RunManager.start); throws when the task or params are invalid. */
  startRun(task: string, params: Record<string, unknown>): { runId: number; deduped: boolean };
  getRun(id: number): RunInfo | null;
  /** The runs rows to push for the website's progress view (the run and its pipeline steps). */
  runRows(id: number): Row[];
  cancelRun(id: number): string;
  gitSync(): Promise<string>;
  fetchDescription(jobId: string): Promise<string>;
  paperEmails(company: string): Promise<string>;
  /** A full two-way cloud sync (waits for one that is running); true when it succeeded. */
  cloudSync(): Promise<boolean>;
}

export interface PollerOptions {
  /** This PC (heartbeat row, claimed_by). */
  machine: { id: string; name: string };
  /** Shown on the website ("dashboard <boot id>"). */
  version: string;
  intervalMs?: number;
  /** Push a running run's row to D1 this often. */
  progressEveryMs?: number;
  /** DNS check before each tick (tests: false). */
  checkOnline?: boolean;
  log?: (m: string) => void;
  now?: () => string;
}

const TERMINAL = new Set(['succeeded', 'failed', 'cancelled', 'timed_out', 'needs_user']);
/** Kinds that need the RunManager to be idle (one Claude run / git operation at a time). */
const NEEDS_IDLE = new Set<RequestKind>(['run', 'sync']);
/** Another PC's heartbeat older than this = that PC is off. */
export const PC_ONLINE_MS = 2 * 60_000;
/** Another PC's started website run older than this no longer blocks (it crashed or lost the network). */
export const OTHER_RUN_STALE_MS = 2 * 3600_000;
const RUN_COLS = ['id', 'task', 'params_json', 'status', 'created_at', 'started_at', 'finished_at', 'pid', 'session_id', 'parent_id',
  'progress_json', 'summary', 'result_subtype', 'num_turns', 'usage_usd', 'error'];

interface Flight { req: RunRequest; runId?: number; lastPush: number; finishing?: boolean; promise?: Promise<void> }

const parse = (s: unknown): Record<string, unknown> => {
  try { const v = JSON.parse(String(s ?? '{}')); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; } catch { return {}; }
};
export const toRequest = (r: Row): RunRequest => ({
  id: Number(r.id), kind: r.kind as RequestKind, task: (r.task as string) ?? null, params: parse(r.params_json),
  status: String(r.status), local_run_id: r.local_run_id == null ? null : Number(r.local_run_id),
});
const short = (s: unknown, n = 400) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

export class RunRequestPoller {
  private inflight = new Map<number, Flight>();
  private ticking = false;
  private recovered = false;
  private stopped = false;
  private timers: NodeJS.Timeout[] = [];
  /** From the last check: what the other PCs are doing (null = nothing that blocks a job-writing run). */
  private otherBusy: string | null = null;

  constructor(private d1: D1, private actions: RequestActions, private opts: PollerOptions) {}

  private now() { return this.opts.now?.() ?? new Date().toISOString(); }
  private log(m: string) { this.opts.log?.(m); }

  start(firstDelayMs = 5_000): void {
    const first = setTimeout(() => { void this.tick(); }, firstDelayMs); first.unref();
    const t = setInterval(() => { void this.tick(); }, this.opts.intervalMs ?? 20_000); t.unref();
    this.timers.push(first, t);
    setRemoteGuard(() => this.otherBusy);
  }

  stop(): void {
    this.stopped = true;
    setRemoteGuard(null);
    for (const t of this.timers) { clearTimeout(t); clearInterval(t); }
  }

  /** Why a job-writing run can't start on this PC now (another PC runs one), or null. */
  blockedBy(): string | null { return this.otherBusy; }

  /** No website request being worked on (the self-update waits for this). */
  isIdle(): boolean { return this.inflight.size === 0; }

  /** Resolves when the background work started so far is finished (tests). */
  async settled(): Promise<void> {
    await Promise.all([...this.inflight.values()].map((f) => f.promise).filter(Boolean));
  }

  /** One check: heartbeat, follow running requests, claim and start queued ones. Never throws. */
  async tick(): Promise<void> {
    if (this.ticking || this.stopped) return;
    this.ticking = true;
    try {
      if (this.actions.ready && !this.actions.ready()) return;
      if (this.opts.checkOnline !== false && !(await online())) return;
      if (!this.recovered) { await this.recover(); this.recovered = true; }
      await this.followRuns();
      const queued = await this.beatAndList();
      for (const req of queued) {
        if (this.stopped) break;
        await this.consider(req);
      }
    } catch (e) {
      this.log(`Website queue: ${(e as Error).message}`);
    } finally {
      this.ticking = false;
    }
  }

  /** Requests a previous dashboard process claimed: follow its runs again; anything else was cut off. */
  private async recover(): Promise<void> {
    const me = this.opts.machine.id;
    const [rows] = await this.d1.query([`SELECT * FROM run_requests WHERE status IN ('claimed','started') AND (claimed_by = ${lit(me)} OR claimed_by IS NULL) ORDER BY id`]);
    for (const r of (rows || []).map(toRequest)) {
      if (this.inflight.has(r.id)) continue;
      if (r.kind === 'run' && r.local_run_id != null && this.actions.getRun(r.local_run_id)) {
        this.inflight.set(r.id, { req: r, runId: r.local_run_id, lastPush: 0 });
      } else {
        await this.finish(r.id, 'failed', 'Interrupted: the dashboard on your PC restarted before it finished. Try again.');
      }
    }
  }

  private async beatAndList(): Promise<RunRequest[]> {
    const at = this.now();
    const busy = !this.actions.idle() || this.inflight.size > 0;
    const currentRequest = [...this.inflight.keys()][0] ?? null;
    const cur = this.actions.currentRun();
    const { id: me, name } = this.opts.machine;
    const [, rows, others, otherRuns] = await this.d1.query([
      `INSERT INTO pc_heartbeat(machine, name, at, version, busy, current_run, current_task, current_request) VALUES (${lit(me)}, ${lit(name)}, ${lit(at)}, ${lit(this.opts.version)}, ${busy ? 1 : 0}, ${lit(cur?.id ?? null)}, ${lit(cur?.task ?? null)}, ${lit(currentRequest)}) ON CONFLICT(machine) DO UPDATE SET name = excluded.name, at = excluded.at, version = excluded.version, busy = excluded.busy, current_run = excluded.current_run, current_task = excluded.current_task, current_request = excluded.current_request RETURNING machine`,
      "SELECT * FROM run_requests WHERE status = 'queued' ORDER BY id LIMIT 20",
      `SELECT machine, name, at, current_run, current_task FROM pc_heartbeat WHERE machine <> ${lit(me)}`,
      `SELECT r.id, r.task, r.claimed_by, r.updated_at, h.name FROM run_requests r LEFT JOIN pc_heartbeat h ON h.machine = r.claimed_by WHERE r.kind = 'run' AND r.status IN ('claimed','started') AND r.claimed_by <> ${lit(me)}`,
    ]);
    this.otherBusy = otherBusyMessage(others || [], otherRuns || [], Date.parse(at));
    return (rows || []).map(toRequest);
  }

  private canStart(req: RunRequest): boolean {
    const flights = [...this.inflight.values()];
    if (req.kind === 'run' && req.task && EXCLUSIVE_TASKS.has(req.task) && this.otherBusy) return false; // the other PC runs one: wait
    if (NEEDS_IDLE.has(req.kind)) return this.actions.idle() && !flights.some((f) => NEEDS_IDLE.has(f.req.kind));
    if (req.kind === 'cancel-run') return this.actions.ownsRun(Number(req.params.runId)); // the PC that runs it stops it
    return !flights.some((f) => f.req.kind === req.kind); // one description fetch / paper search at a time
  }

  /** Atomic claim: only one poller can move a request out of 'queued'. */
  private async claim(id: number): Promise<boolean> {
    const at = this.now();
    const [rows] = await this.d1.query([`UPDATE run_requests SET status = 'claimed', claimed_at = ${lit(at)}, claimed_by = ${lit(this.opts.machine.id)}, updated_at = ${lit(at)} WHERE id = ${lit(id)} AND status = 'queued' RETURNING id`]);
    return Boolean(rows && rows.length);
  }

  private async update(id: number, set: Record<string, unknown>): Promise<void> {
    const cols = { ...set, updated_at: this.now() };
    await this.d1.exec(`UPDATE run_requests SET ${Object.entries(cols).map(([k, v]) => `${k} = ${lit(v)}`).join(', ')} WHERE id = ${lit(id)};`);
  }

  private async finish(id: number, status: 'done' | 'failed', message: string, result?: Record<string, unknown>): Promise<void> {
    this.inflight.delete(id);
    await this.update(id, { status, message: short(message), result_json: result ? JSON.stringify(result) : null });
    this.log(`Website request #${id}: ${status}${message ? ` (${short(message, 120)})` : ''}`);
  }

  private async consider(req: RunRequest): Promise<void> {
    if (this.inflight.has(req.id) || !this.canStart(req)) return;
    if (!(await this.claim(req.id))) return;
    this.log(`Website request #${req.id}: ${req.kind}${req.task ? ` ${req.task}` : ''}`);
    if (req.kind === 'run') {
      let runId: number;
      try {
        if (!req.task) throw new Error('No task given');
        ({ runId } = this.actions.startRun(req.task, req.params));
      } catch (e) {
        await this.finish(req.id, 'failed', (e as Error).message);
        return;
      }
      this.inflight.set(req.id, { req, runId, lastPush: 0 });
      await this.update(req.id, { status: 'started', local_run_id: runId, message: `Started run #${runId}` });
      await this.pushRun(runId).catch(() => undefined);
      this.inflight.get(req.id)!.lastPush = Date.now();
      return;
    }
    if (req.kind === 'cancel-run') {
      try { await this.finish(req.id, 'done', this.actions.cancelRun(Number(req.params.runId))); }
      catch (e) { await this.finish(req.id, 'failed', (e as Error).message); }
      return;
    }
    const flight: Flight = { req, lastPush: 0 };
    this.inflight.set(req.id, flight);
    await this.update(req.id, { status: 'started' });
    flight.promise = (async () => {
      try {
        const message = req.kind === 'sync' ? await this.actions.gitSync()
          : req.kind === 'fetch-description' ? await this.actions.fetchDescription(String(req.params.jobId ?? ''))
            : await this.actions.paperEmails(String(req.params.company ?? ''));
        const synced = await this.actions.cloudSync();
        await this.finish(req.id, 'done', message, { synced });
      } catch (e) {
        await this.finish(req.id, 'failed', (e as Error).message).catch(() => undefined);
      }
    })();
  }

  /** Pushes running runs' progress; finishes requests whose run ended (after a full cloud sync). */
  private async followRuns(): Promise<void> {
    for (const f of [...this.inflight.values()]) {
      if (f.runId == null || f.finishing) continue;
      const run = this.actions.getRun(f.runId);
      if (!run) { await this.finish(f.req.id, 'failed', `Run #${f.runId} is missing on the PC`); continue; }
      if (TERMINAL.has(run.status)) {
        f.finishing = true;
        const synced = await this.actions.cloudSync();
        if (!synced) await this.pushRun(f.runId).catch(() => undefined); // at least the run's own row
        const ok = run.status === 'succeeded';
        const message = ok ? short(run.summary?.split('\n').find((l) => l.trim()) || 'Finished', 300) : short(run.error || run.status.replace('_', ' '));
        await this.finish(f.req.id, ok ? 'done' : 'failed', message, { runStatus: run.status, counters: run.counters || {}, synced });
        continue;
      }
      if (Date.now() - f.lastPush >= (this.opts.progressEveryMs ?? 25_000)) {
        f.lastPush = Date.now();
        await this.pushRun(f.runId).catch((e) => this.log(`Website queue: progress push failed: ${(e as Error).message}`));
      }
    }
  }

  private async pushRun(id: number): Promise<void> {
    const rows = this.actions.runRows(id);
    if (!rows.length) return;
    const upd = RUN_COLS.filter((c) => c !== 'id');
    await this.d1.exec(rows.map((r) => `INSERT INTO runs(${RUN_COLS.join(', ')}) VALUES (${RUN_COLS.map((c) => lit(r[c])).join(', ')}) ON CONFLICT(id) DO UPDATE SET ${upd.map((c) => `${c} = excluded.${c}`).join(', ')};`).join('\n'));
  }
}

/**
 * What another PC is doing that blocks a job-writing run here: a fresh heartbeat (< 2 min) with such a run, or a website
 * run it claimed in the last 2 h. Null when nothing blocks.
 */
export function otherBusyMessage(heartbeats: Row[], requests: Row[], now = Date.now()): string | null {
  for (const h of heartbeats) {
    if (now - Date.parse(String(h.at)) < PC_ONLINE_MS && h.current_run != null && EXCLUSIVE_TASKS.has(String(h.current_task))) {
      return `${h.name || h.machine} is running ${String(h.current_task).replace(/-/g, ' ')} (run #${h.current_run}); one at a time across your PCs. Try again when it is done.`;
    }
  }
  for (const r of requests) {
    if (EXCLUSIVE_TASKS.has(String(r.task)) && now - Date.parse(String(r.updated_at)) < OTHER_RUN_STALE_MS) {
      return `${r.name || r.claimed_by} is running ${String(r.task).replace(/-/g, ' ')} from the website (request #${r.id}); one at a time across your PCs.`;
    }
  }
  return null;
}

// ---------------------------------------------------------------- the real actions (the dashboard's own code paths)

export function localActions(ctx: Ctx, runs: RunManager, scheduler: CloudSyncScheduler | null, deps: {
  fetchDescription: (j: { id: string; url: string }) => Promise<{ description: string }>;
  gitSync: () => Promise<{ importedJobs: number; warning: string | null; pushed?: boolean }>;
  setDescription: (id: string, description: string) => { description?: string | null };
  getJobUrl: (id: string) => string;
  startPaperEmails: (company: string) => Promise<{ status: string; error: string | null; result: { hits: unknown[]; checked: number } }>;
}): RequestActions {
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  return {
    ready: () => getState(ctx.db, 'machine.idx') != null,
    idle: () => runs.isIdle(),
    currentRun: () => { const r = runs.list(10).find((x) => x.parent_id == null && x.status === 'running' && ownsRun(ctx.db, x.id)); return r ? { id: r.id, task: r.task } : null; },
    ownsRun: (id) => ownsRun(ctx.db, id),
    startRun: (task, params) => { const { run, deduped } = runs.start(task, params); return { runId: run.id, deduped }; },
    getRun: (id) => {
      try {
        const r = runs.get(id);
        return { id: r.id, status: r.status, error: r.error, summary: r.summary, counters: r.progress.counters as unknown as Record<string, number> };
      } catch { return null; }
    },
    runRows: (id) => ctx.db.prepare('SELECT * FROM runs WHERE id = ? OR parent_id = ? ORDER BY id').all(id, id) as Row[],
    cancelRun: (id) => { const r = runs.cancel(id); return `Run #${id}: ${r.status === 'running' ? 'stopping' : r.status}`; },
    gitSync: async () => {
      const r = await deps.gitSync();
      if (r.warning) throw new Error(r.warning);
      return `${r.importedJobs ? `Imported ${r.importedJobs} new job${r.importedJobs === 1 ? '' : 's'}` : 'Up to date: no new jobs'}${r.pushed ? ' · pushed to GitHub' : ''}`;
    },
    fetchDescription: async (jobId) => {
      const url = deps.getJobUrl(jobId);
      let d: { description: string };
      try { d = await deps.fetchDescription({ id: jobId, url }); } catch (e) { throw new Error(`Couldn't fetch the description: ${(e as Error).message}`); }
      const job = deps.setDescription(jobId, d.description);
      return job.description ? `Description saved (${job.description.length.toLocaleString('en-US')} characters)` : 'The posting has no readable description';
    },
    paperEmails: async (company) => {
      const s = await deps.startPaperEmails(company);
      if (s.status === 'error') throw new Error(s.error || 'The search failed');
      const n = s.result.hits.length;
      return `${n} address${n === 1 ? '' : 'es'} found (${s.result.checked} people checked)`;
    },
    cloudSync: async () => {
      if (!scheduler) return false;
      for (let i = 0; scheduler.running && i < 300; i++) await sleep(1000);
      return (await scheduler.now()) != null;
    },
  };
}

/** The real setup (index.ts): the dashboard's code for each kind. */
export function realActions(ctx: Ctx, runs: RunManager, scheduler: CloudSyncScheduler | null): RequestActions {
  return localActions(ctx, runs, scheduler, {
    fetchDescription: (j) => fetchDescription(j) as Promise<{ description: string }>,
    gitSync: () => sync(ctx),
    setDescription: (id, d) => setDescription(ctx.db, id, d),
    getJobUrl: (id) => getJob(ctx.db, id, false).url,
    startPaperEmails: async (company) => {
      startPaperEmailSearch(ctx, company);
      await paperEmailSearchDone(company);
      return getPaperEmailSearch(ctx.db, company)!;
    },
  });
}
