// Runs headless Claude Code for dashboard tasks: a FIFO queue (one run at a time), spawn, live progress from the
// stream, raw logs in data/runs/, cancel, timeouts, "Continue" (--resume) and pipelines (plan v2 §3).
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { EventEmitter } from 'node:events';
import type { ChildProcess } from 'node:child_process';
import type { Ctx } from '../sync';
import { noGit } from '../git';
import { HttpError, nowIso } from '../repo';
import type { PipelineStep, Run, RunProgress, RunStatus } from '../../shared/types';
import { buildClaudeArgs, scratchDir } from './args';
import { killTree, resolveClaude, runEnv, spawnResolved, type ResolvedCommand } from './claude';
import { dedupeKey, validateParams } from './params';
import { buildPrompt, continuePrompt, type PromptInfo } from './prompts';
import { activeRuns, getRun, insertRun, listRuns, ownsRun, recoverOrphans, updateRun } from './store';
import { emptyProgress, StreamParser } from './stream';
import { effectiveTask, isTaskId, TASKS, type TaskDef, type TaskId } from './tasks';
import { remoteBusy } from './remoteGuard';

export type SpawnFn = (r: ResolvedCommand, args: string[], o: { cwd: string; env: NodeJS.ProcessEnv }) => ChildProcess;

export interface PipelineApi {
  run: Run;
  ctx: Ctx;
  params: Record<string, unknown>;
  setSteps: (steps: PipelineStep[]) => void;
  step: (key: string, patch: Partial<PipelineStep>) => void;
  /** Runs one Claude step now (inside the pipeline's queue slot) and returns the finished child run. */
  runChild: (task: TaskId, params: Record<string, unknown>, info?: Omit<PromptInfo, 'runId' | 'params'>) => Promise<Run>;
  cancelled: () => boolean;
  /** Merges fields into the pipeline's progress. */
  patchProgress: (p: Partial<RunProgress>) => void;
  /** Waits (cancellable) until `untilIso`, showing `reason`; used when the plan's usage limit is hit. */
  pauseUntil: (untilIso: string, reason: string) => Promise<boolean>;
}

export interface PipelineOutcome { status: RunStatus; summary: string; error?: string | null }
export type PipelineFn = (api: PipelineApi) => Promise<PipelineOutcome>;

export interface RunManagerOptions {
  spawnFn?: SpawnFn;
  /** After every finished top-level run (tracker export, auto-commit). */
  onFinished?: (run: Run) => void | Promise<void>;
  pipelines?: Partial<Record<TaskId, PipelineFn>>;
  /** How often live progress is written to the DB and pushed to the browser. */
  saveEveryMs?: number;
}

interface Live { child: ChildProcess | null; cancelled: boolean; timedOut: boolean; failure: string | null }

/**
 * Counters from the database: CLI writes inside a run are tagged with the run id (events.detail.run). More reliable than
 * counting tool calls, because Claude may chain several `cli rank` calls in one shell command.
 */
export function dbCounters(db: Ctx['db'], runId: number): Partial<Record<'ranked' | 'statuses' | 'outreach' | 'contacts' | 'jobsAdded', number>> {
  const rows = db.prepare(`SELECT entity, kind, count(DISTINCT entity_id) AS n, sum(CASE WHEN kind = 'status' AND json_extract(detail_json, '$.to') != 'ranked' THEN 1 ELSE 0 END) AS moves
    FROM events WHERE json_extract(detail_json, '$.run') = ? GROUP BY entity, kind`).all(runId) as { entity: string; kind: string; n: number; moves: number }[];
  const get = (entity: string, kind: string) => rows.find((r) => r.entity === entity && r.kind === kind);
  return {
    ranked: get('job', 'rank')?.n ?? 0, statuses: get('job', 'status')?.moves ?? 0, outreach: get('outreach', 'created')?.n ?? 0,
    contacts: get('contact', 'created')?.n ?? 0, jobsAdded: get('job', 'manual_added')?.n ?? 0,
  };
}

function mergeCounters(progress: RunProgress, db: Ctx['db'], runId: number): RunProgress {
  const d = dbCounters(db, runId);
  const c = { ...progress.counters };
  for (const [k, v] of Object.entries(d) as [keyof typeof d, number][]) c[k] = Math.max(c[k] || 0, v);
  progress.counters = c;
  return progress;
}

const DEFAULT_PAUSE_MS = 60 * 60 * 1000;

export class RunManager extends EventEmitter {
  private live = new Map<number, Live>();
  private busy = false;
  private idleWaiters: (() => void)[] = [];
  private pauseTimer: NodeJS.Timeout | null = null;
  paused: { until: string; reason: string } | null = null;
  private closed = false;

  constructor(private ctx: Ctx, private opts: RunManagerOptions = {}) {
    super();
    this.setMaxListeners(100);
  }

  /** Marks runs left over from a previous server as failed/cancelled. Call once at startup. */
  recover(): number { return recoverOrphans(this.ctx.db); }

  get(id: number): Run { return getRun(this.ctx.db, id); }
  list(limit = 20): Run[] { return listRuns(this.ctx.db, { limit }); }
  children(id: number): Run[] { return listRuns(this.ctx.db, { parentId: id }); }

  private save(id: number, patch: Parameters<typeof updateRun>[2]): Run {
    const run = updateRun(this.ctx.db, id, patch);
    this.emit('run', run);
    return run;
  }

  /** Queues a run (or returns the one of the same task that is already queued/running). */
  start(taskId: string, raw: Record<string, unknown> = {}): { run: Run; deduped: boolean } {
    if (!isTaskId(taskId)) throw new HttpError(400, `Unknown task "${taskId}"`);
    const other = remoteBusy(taskId);
    if (other) throw new HttpError(409, other);
    const task = effectiveTask(taskId, this.ctx.cfg);
    const { params } = validateParams(task, raw, this.ctx.db);
    const key = dedupeKey(task, params);
    const existing = activeRuns(this.ctx.db).find((r) => r.parent_id == null && isTaskId(r.task) && dedupeKey(TASKS[r.task], r.params) === key);
    if (existing) return { run: existing, deduped: true };
    const run = insertRun(this.ctx.db, taskId, params, { progress: emptyProgress(typeof params.limit === 'number' ? params.limit : undefined) });
    this.emit('run', run);
    queueMicrotask(() => this.pump());
    return { run, deduped: false };
  }

  /** "Continue": a new run that resumes the earlier run's Claude session with the owner's note. */
  continueRun(id: number, note?: string): { run: Run; deduped: boolean } {
    const prev = this.get(id);
    if (!isTaskId(prev.task)) throw new HttpError(400, `Unknown task "${prev.task}"`);
    if (['queued', 'running'].includes(prev.status)) throw new HttpError(409, 'This run is still going');
    if (!prev.session_id) throw new HttpError(409, "This run has no Claude session to continue (it never started). Start the task again instead.");
    if (TASKS[prev.task].pipeline || TASKS[prev.task].pipelineWhen?.(prev.params)) throw new HttpError(409, 'Pipelines are started again, not continued');
    const task = TASKS[prev.task];
    const key = dedupeKey(task, prev.params);
    const existing = activeRuns(this.ctx.db).find((r) => r.parent_id == null && isTaskId(r.task) && dedupeKey(TASKS[r.task], r.params) === key);
    if (existing) return { run: existing, deduped: true };
    const params = { ...prev.params, _continue: { from: prev.id, session: prev.session_id, note: note?.slice(0, 2000) || '' } };
    const run = insertRun(this.ctx.db, prev.task, params, { progress: emptyProgress(prev.progress.target) });
    this.emit('run', run);
    queueMicrotask(() => this.pump());
    return { run, deduped: false };
  }

  cancel(id: number): Run {
    const run = this.get(id);
    if (!ownsRun(this.ctx.db, id)) throw new HttpError(409, 'This run is on your other PC; stop it there (or from the website).');
    if (run.status === 'queued') return this.save(id, { status: 'cancelled', finished_at: nowIso(), error: 'Cancelled before it started' });
    if (run.status !== 'running') throw new HttpError(409, `The run is already ${run.status.replace('_', ' ')}`);
    const l = this.live.get(id);
    if (!l) {
      // Running in another process (e.g. the CLI), or its process is gone: stop it by pid.
      killTree(null, run.pid);
      return this.save(id, { status: 'cancelled', finished_at: nowIso(), error: 'Cancelled' });
    }
    l.cancelled = true;
    for (const child of this.children(id)) { const cl = this.live.get(child.id); if (cl) { cl.cancelled = true; killTree(cl.child); } }
    killTree(l.child);
    return this.get(id);
  }

  /** Nothing queued or running (the self-update waits for this before restarting). */
  isIdle(): boolean { return !this.busy && !this.nextQueued(); }

  /** Resolves when nothing is queued or running (tests, the CLI). */
  whenIdle(): Promise<void> {
    if (!this.busy && !this.nextQueued()) return Promise.resolve();
    return new Promise((r) => this.idleWaiters.push(r));
  }

  shutdown(): void {
    this.closed = true;
    if (this.pauseTimer) clearTimeout(this.pauseTimer);
    for (const [, l] of this.live) { l.cancelled = true; killTree(l.child); }
  }

  private nextQueued(): Run | null {
    return activeRuns(this.ctx.db).find((r) => r.status === 'queued' && r.parent_id == null) || null;
  }

  private settleIdle() {
    if (this.busy || this.nextQueued()) return;
    const w = this.idleWaiters.splice(0);
    w.forEach((f) => f());
  }

  private async pump(): Promise<void> {
    if (this.busy || this.closed) return;
    if (this.paused && new Date(this.paused.until).getTime() > Date.now()) { this.settleIdle(); return; }
    this.paused = null;
    const next = this.nextQueued();
    if (!next) { this.settleIdle(); return; }
    this.busy = true;
    let finished: Run | null = null;
    try {
      finished = await this.executeTop(next);
    } catch (e) {
      finished = this.save(next.id, { status: 'failed', finished_at: nowIso(), error: (e as Error).message });
    } finally {
      this.busy = false;
    }
    try { if (finished) await this.opts.onFinished?.(finished); } catch (e) { console.error('after-run hook failed:', e); }
    this.emit('finished', finished);
    if (finished?.progress.usageLimit && finished.status === 'needs_user') this.pauseQueue(finished.progress.usageLimit.resetsAt);
    setImmediate(() => this.pump());
  }

  private pauseQueue(resetsAt: string | null) {
    const until = resetsAt && new Date(resetsAt).getTime() > Date.now() ? resetsAt : new Date(Date.now() + DEFAULT_PAUSE_MS).toISOString();
    this.paused = { until, reason: 'Paused: plan usage limit' };
    if (this.pauseTimer) clearTimeout(this.pauseTimer);
    this.pauseTimer = setTimeout(() => { this.paused = null; this.pump(); }, Math.max(1000, new Date(until).getTime() - Date.now()));
    this.pauseTimer.unref?.();
    this.emit('paused', this.paused);
  }

  /** Clears a usage-limit pause (The owner clicked "Resume now"). */
  resume(): void {
    this.paused = null;
    if (this.pauseTimer) { clearTimeout(this.pauseTimer); this.pauseTimer = null; }
    this.pump();
  }

  private async executeTop(run: Run): Promise<Run> {
    const taskId = run.task as TaskId;
    const task = effectiveTask(taskId, this.ctx.cfg);
    const pipeline = this.opts.pipelines?.[taskId];
    if (pipeline && (task.pipeline || task.pipelineWhen?.(run.params))) return this.executePipeline(run, pipeline);
    const cont = run.params._continue as { session: string; note: string } | undefined;
    const { _continue: _c, ...params } = run.params;
    const { info } = validateParams(task, params, this.ctx.db);
    return this.executeClaude(run, task, { ...info, params, runId: run.id }, cont ? { session: cont.session, note: cont.note } : undefined);
  }

  private async executePipeline(run: Run, fn: PipelineFn): Promise<Run> {
    const live: Live = { child: null, cancelled: false, timedOut: false, failure: null };
    this.live.set(run.id, live);
    let progress: RunProgress = { ...run.progress, pipeline: [] };
    this.save(run.id, { status: 'running', started_at: nowIso(), pid: process.pid, progress });
    const push = () => { this.save(run.id, { progress }); };
    const api: PipelineApi = {
      run, ctx: this.ctx, params: run.params,
      setSteps: (steps) => { progress = { ...progress, pipeline: steps }; push(); },
      step: (key, patch) => {
        progress = { ...progress, pipeline: (progress.pipeline || []).map((s) => (s.key === key ? { ...s, ...patch } : s)) };
        if (patch.detail || patch.status) progress.steps = [...progress.steps, { at: nowIso(), text: `${(progress.pipeline || []).find((s) => s.key === key)?.label}: ${patch.detail || patch.status}`, kind: 'step' as const }].slice(-60);
        push();
      },
      patchProgress: (p) => { progress = { ...progress, ...p }; push(); },
      cancelled: () => live.cancelled,
      runChild: async (task, params, info) => {
        const def = effectiveTask(task, this.ctx.cfg);
        const child = insertRun(this.ctx.db, task, params, { parentId: run.id, progress: emptyProgress(typeof params.limit === 'number' ? params.limit : undefined) });
        const valid = info ? { info } : validateParams(def, params, this.ctx.db);
        const done = await this.executeClaude(child, def, { ...valid.info, params, runId: child.id });
        // Roll the child's counters and usage up into the pipeline.
        const c = progress.counters; const d = done.progress.counters;
        for (const k of Object.keys(c) as (keyof typeof c)[]) c[k] += d[k] || 0;
        const u = progress.usage || { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };
        const du = done.progress.usage;
        if (du) for (const k of Object.keys(u) as (keyof typeof u)[]) u[k] += du[k] || 0;
        progress = { ...progress, counters: c, usage: u, lastText: done.progress.lastText ?? progress.lastText };
        const usd = (this.get(run.id).usage_usd || 0) + (done.usage_usd || 0);
        const turns = (this.get(run.id).num_turns || 0) + (done.num_turns || 0);
        this.save(run.id, { progress, usage_usd: usd, num_turns: turns });
        return done;
      },
      pauseUntil: (until, reason) => new Promise<boolean>((resolve) => {
        this.paused = { until, reason };
        this.emit('paused', this.paused);
        const t = setInterval(() => {
          if (live.cancelled) { clearInterval(t); this.paused = null; resolve(false); }
          else if (!this.paused || Date.now() >= new Date(until).getTime()) { clearInterval(t); this.paused = null; resolve(true); }
        }, 500);
      }),
    };
    try {
      const out = await fn(api);
      const status: RunStatus = live.cancelled ? 'cancelled' : out.status;
      return this.save(run.id, { status, finished_at: nowIso(), summary: out.summary, error: live.cancelled ? 'Cancelled' : out.error ?? null, progress });
    } catch (e) {
      return this.save(run.id, { status: live.cancelled ? 'cancelled' : 'failed', finished_at: nowIso(), error: (e as Error).message, progress });
    } finally {
      this.live.delete(run.id);
    }
  }

  /** Spawns claude for one run and follows it to the end. */
  private executeClaude(run: Run, task: TaskDef, info: PromptInfo, resume?: { session: string; note: string }): Promise<Run> {
    const { cfg } = this.ctx;
    const resolved = resolveClaude(cfg.claudeCommand);
    if (!resolved) {
      return Promise.resolve(this.save(run.id, {
        status: 'failed', finished_at: nowIso(),
        error: `Claude Code was not found ("${cfg.claudeCommand}"). Open a terminal, run \`claude\`, log in once, then try again.`,
      }));
    }
    fs.mkdirSync(path.join(cfg.repoRoot, scratchDir(run.id)), { recursive: true });
    const logDir = path.join(cfg.dataDir, 'runs');
    fs.mkdirSync(logDir, { recursive: true });
    const log = fs.createWriteStream(path.join(logDir, `${run.id}.jsonl`), { flags: 'a' });
    const prompt = resume ? continuePrompt(resume.note) : buildPrompt(task, info);
    const args = buildClaudeArgs(task, { runId: run.id, prompt, resume: resume?.session });
    const env = runEnv(process.env, {
      JOBWATCHER_RUN_ID: String(run.id), JOBWATCHER_RUN_MODEL: task.model, JOBWATCHER_REPO: cfg.repoRoot, JOBWATCHER_DATA: cfg.dataDir, JOBWATCHER_DB: cfg.dbPath,
      ...(this.ctx.git === noGit ? { JOBWATCHER_GIT: 'off' } : {}),
    });
    const parser = new StreamParser(run.progress);
    const live: Live = { child: null, cancelled: false, timedOut: false, failure: null };
    this.live.set(run.id, live);

    return new Promise<Run>((resolve) => {
      let child: ChildProcess;
      try {
        child = (this.opts.spawnFn || spawnResolved)(resolved, args, { cwd: cfg.repoRoot, env });
      } catch (e) {
        this.live.delete(run.id); log.end();
        resolve(this.save(run.id, { status: 'failed', finished_at: nowIso(), error: `Couldn't start Claude Code: ${(e as Error).message}` }));
        return;
      }
      live.child = child;
      this.save(run.id, { status: 'running', started_at: nowIso(), pid: child.pid ?? null, progress: parser.progress });

      let dirty = false; let stderr = ''; let settled = false;
      const flush = () => { if (!dirty) return; dirty = false; this.save(run.id, { progress: mergeCounters(parser.progress, this.ctx.db, run.id), session_id: parser.sessionId }); };
      const ticker = setInterval(flush, this.opts.saveEveryMs ?? 400);
      const timer = setTimeout(() => { live.timedOut = true; killTree(child); }, task.timeoutMin * 60_000);
      timer.unref?.();

      const rl = readline.createInterface({ input: child.stdout! });
      rl.on('line', (line) => {
        log.write(line + '\n');
        const type = parser.push(line);
        if (type) dirty = true;
        if (type === 'system' && task.chrome && !live.failure) {
          const st = parser.chromeStatus();
          if (st !== 'connected') {
            live.failure = `Claude in Chrome isn't connected${st ? ` (status: ${st})` : ''}. Open Chrome and make sure the Claude extension is signed in, then try again.`;
            killTree(child);
          }
        }
      });
      child.stderr?.on('data', (d: Buffer) => { stderr = (stderr + d.toString()).slice(-4000); });

      const finish = (code: number | null, spawnError?: Error) => {
        if (settled) return;
        settled = true;
        clearInterval(ticker); clearTimeout(timer);
        rl.close(); log.end();
        this.live.delete(run.id);
        const r = parser.result;
        let status: RunStatus; let error: string | null = null; let summary: string | null = null;
        if (live.cancelled) { status = 'cancelled'; error = 'Cancelled'; }
        else if (live.timedOut) { status = 'timed_out'; error = `Stopped after ${task.timeoutMin} minutes (the time limit for this task).`; }
        else if (live.failure) { status = 'failed'; error = live.failure; }
        else if (spawnError) { status = 'failed'; error = `Couldn't start Claude Code: ${spawnError.message}`; }
        else if (r && r.subtype === 'success' && !r.isError) { status = 'succeeded'; summary = r.text || parser.progress.lastText || null; }
        else if (parser.progress.usageLimit) {
          status = 'needs_user';
          const at = parser.progress.usageLimit.resetsAt;
          error = `Paused: plan usage limit${at ? `, resumes at ${new Date(at).toLocaleString()}` : ''}. The queue continues by itself after the reset; this run can be continued then.`;
        }
        else if (r && r.subtype === 'error_max_turns') {
          status = 'needs_user';
          error = `Claude stopped after ${r.numTurns ?? task.maxTurns} turns (the limit for this task). Click Continue to let it finish, or raise maxTurns in dashboard/config.json.`;
        }
        else if (r) { status = 'failed'; error = r.text || `Claude Code stopped (${r.subtype})`; }
        else if (/usage limit|hit your limit/i.test(stderr)) {
          parser.flagUsageLimit(stderr);
          status = 'needs_user'; error = 'Paused: plan usage limit. The queue continues by itself after the reset.';
        }
        else { status = 'failed'; error = stderr.trim() ? `Claude Code exited (code ${code}): ${stderr.trim().split(/\r?\n/).slice(-3).join(' ')}` : `Claude Code exited with code ${code} before finishing.`; }
        if (!summary && status !== 'succeeded') summary = r?.text || parser.progress.lastText || null;
        const done = this.save(run.id, {
          status, finished_at: nowIso(), error, summary, progress: mergeCounters(parser.progress, this.ctx.db, run.id), session_id: parser.sessionId,
          result_subtype: r?.subtype ?? null, num_turns: r?.numTurns ?? null, usage_usd: r?.costUsd ?? null,
        });
        this.pruneLogs();
        resolve(done);
      };
      child.on('error', (e) => finish(null, e));
      child.on('close', (code) => finish(code));
    });
  }

  private pruneLogs() {
    const dir = path.join(this.ctx.cfg.dataDir, 'runs');
    try {
      const files = fs.readdirSync(dir).filter((f) => /^\d+\.jsonl$/.test(f)).sort((a, b) => parseInt(a) - parseInt(b));
      for (const f of files.slice(0, Math.max(0, files.length - this.ctx.cfg.runs.keepLogs))) fs.rmSync(path.join(dir, f), { force: true });
    } catch { /* no logs yet */ }
  }

  logPath(id: number): string { return path.join(this.ctx.cfg.dataDir, 'runs', `${id}.jsonl`); }
}
