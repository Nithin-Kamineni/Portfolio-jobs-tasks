// The website's PC queue (server/runRequests.ts) against a fake D1: an in-memory SQLite database with the dashboard's
// schema plus site/migrations/0017_run_requests.sql. Fake actions for the claim/dispatch rules; one test runs the real
// RunManager with the fake claude (the same code path as the dashboard's own "Process new jobs" button).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { openDb, type DB } from '../../server/db';
import { ensureSyncTables, type D1 } from '../../server/cloudSync';
import { realActions, RunRequestPoller, type RequestActions, type RunInfo } from '../../server/runRequests';
import { createApp } from '../../server/app';
import { importLocal } from '../../server/sync';
import type { RunManager } from '../../server/runs/runner';
import { clearPreflightCache } from '../../server/runs/claude';
import { fakeScenario, makeFixture, type Fixture } from '../helpers';

const MIG = (n: string) => fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../fixtures/site-migrations', n), 'utf8');
const MIGRATION = MIG('0017_run_requests.sql') + MIG('0018_machines.sql');

function fakeCloud(): { db: DB; d1: D1 } {
  const db = openDb(':memory:');
  db.exec(MIGRATION);
  return { db, d1: { async query(sqls) { return sqls.map((s) => db.prepare(s).all() as Record<string, unknown>[]); }, async exec(sql) { db.exec(sql); } } };
}

function request(db: DB, kind: string, task: string | null = null, params: Record<string, unknown> = {}): number {
  const at = new Date().toISOString();
  return Number(db.prepare('INSERT INTO run_requests(kind, task, params_json, requested_at, requested_by, status, updated_at) VALUES (?,?,?,?,?,?,?)')
    .run(kind, task, JSON.stringify(params), at, 'test', 'queued', at).lastInsertRowid);
}
const req = (db: DB, id: number) => db.prepare('SELECT * FROM run_requests WHERE id = ?').get(id) as Record<string, unknown>;

interface Fake extends RequestActions { calls: string[]; busy: boolean; runs: Map<number, RunInfo>; failStart?: string }
function fakeActions(): Fake {
  let next = 100;
  const a: Fake = {
    calls: [], busy: false, runs: new Map(),
    idle: () => !a.busy,
    currentRun: () => { const r = [...a.runs.values()].find((x) => x.status === 'running'); return r ? { id: r.id, task: 'process-new-jobs' } : null; },
    ownsRun: (id) => a.runs.has(id),
    startRun: (task, params) => {
      a.calls.push(`start ${task} ${JSON.stringify(params)}`);
      if (a.failStart) throw new Error(a.failStart);
      const id = next++;
      a.runs.set(id, { id, status: 'running', counters: {} });
      return { runId: id, deduped: false };
    },
    getRun: (id) => a.runs.get(id) ?? null,
    runRows: (id) => {
      const r = a.runs.get(id);
      return r ? [{ id, task: 'process-new-jobs', params_json: '{}', status: r.status, created_at: '2026-10-17T00:00:00Z', progress_json: JSON.stringify({ counters: r.counters }) }] : [];
    },
    cancelRun: (id) => { a.calls.push(`cancel ${id}`); const r = a.runs.get(id); if (r) r.status = 'cancelled'; return `Run #${id}: cancelled`; },
    gitSync: async () => { a.calls.push('git sync'); return 'Imported 2 new jobs'; },
    fetchDescription: async (jobId) => { a.calls.push(`fetch ${jobId}`); if (jobId === 'bad') throw new Error("Couldn't fetch the description: HTTP 404"); return 'Description saved (1,200 characters)'; },
    paperEmails: async (company) => { a.calls.push(`papers ${company}`); return '2 addresses found (5 people checked)'; },
    cloudSync: async () => { a.calls.push('cloud sync'); return true; },
  };
  return a;
}

const poller = (d1: D1, a: RequestActions, machine = { id: 'home', name: 'Home PC' }) => new RunRequestPoller(d1, a, { machine, version: 'test', checkOnline: false, progressEveryMs: 0 });

describe('website queue: claim and dispatch (fake actions)', () => {
  it('a run request: queued → started (run id recorded, progress pushed) → done after a cloud sync', async () => {
    const { db, d1 } = fakeCloud(); const a = fakeActions(); const p = poller(d1, a);
    const id = request(db, 'run', 'process-new-jobs', { limit: 40 });
    await p.tick();
    expect(req(db, id)).toMatchObject({ status: 'started', local_run_id: 100, message: 'Started run #100' });
    expect(req(db, id).claimed_at).toBeTruthy();
    expect(a.calls).toEqual(['start process-new-jobs {"limit":40}']);
    expect(db.prepare('SELECT status FROM runs WHERE id = 100').get()).toEqual({ status: 'running' });
    expect(db.prepare("SELECT name, version FROM pc_heartbeat WHERE machine = 'home'").get()).toEqual({ name: 'Home PC', version: 'test' });
    expect(req(db, id).claimed_by).toBe('home');
    expect(p.isIdle()).toBe(false);

    // still running: progress pushed again, request unchanged
    a.runs.get(100)!.counters = { ranked: 3 };
    await p.tick();
    expect(req(db, id).status).toBe('started');
    expect(JSON.parse(String((db.prepare('SELECT progress_json FROM runs WHERE id = 100').get() as { progress_json: string }).progress_json)).counters).toEqual({ ranked: 3 });
    expect((db.prepare('SELECT busy, current_run, current_task FROM pc_heartbeat').get())).toEqual({ busy: 1, current_run: 100, current_task: 'process-new-jobs' });

    Object.assign(a.runs.get(100)!, { status: 'succeeded', summary: 'Ranked 12 new jobs.\nTop: NVIDIA', counters: { ranked: 12 } });
    await p.tick();
    const done = req(db, id);
    expect(done).toMatchObject({ status: 'done', message: 'Ranked 12 new jobs.' });
    expect(JSON.parse(String(done.result_json))).toEqual({ runStatus: 'succeeded', counters: { ranked: 12 }, synced: true });
    expect(a.calls).toContain('cloud sync');
    expect(p.isIdle()).toBe(true);
  });

  it('busy PC: a run request stays queued until the RunManager is idle; quick kinds still go', async () => {
    const { db, d1 } = fakeCloud(); const a = fakeActions(); const p = poller(d1, a);
    a.busy = true;
    const run = request(db, 'run', 'weekly-review');
    const sync = request(db, 'sync');
    const fetch = request(db, 'fetch-description', null, { jobId: 'j1' });
    await p.tick(); await p.settled();
    expect(req(db, run).status).toBe('queued');
    expect(req(db, sync).status).toBe('queued');
    expect(req(db, fetch)).toMatchObject({ status: 'done', message: 'Description saved (1,200 characters)' });
    expect(db.prepare('SELECT busy FROM pc_heartbeat').get()).toEqual({ busy: 1 });
    a.busy = false;
    await p.tick();
    expect(req(db, run).status).toBe('started');
    expect(req(db, sync).status).toBe('queued'); // one run/git operation at a time
  });

  it('git sync, description fetch and paper search: done with the message; a failure is recorded', async () => {
    const { db, d1 } = fakeCloud(); const a = fakeActions(); const p = poller(d1, a);
    const s = request(db, 'sync');
    const bad = request(db, 'fetch-description', null, { jobId: 'bad' });
    const pe = request(db, 'paper-emails', null, { company: 'NVIDIA' });
    await p.tick(); await p.settled();
    expect(req(db, s)).toMatchObject({ status: 'done', message: 'Imported 2 new jobs' });
    expect(JSON.parse(String(req(db, s).result_json))).toEqual({ synced: true });
    expect(req(db, bad)).toMatchObject({ status: 'failed', message: "Couldn't fetch the description: HTTP 404" });
    expect(req(db, pe)).toMatchObject({ status: 'done', message: '2 addresses found (5 people checked)' });
    expect(a.calls).toEqual(expect.arrayContaining(['git sync', 'fetch bad', 'papers NVIDIA']));
  });

  it('failures: an invalid task fails at once; a run that ends badly fails with its error', async () => {
    const { db, d1 } = fakeCloud(); const a = fakeActions(); const p = poller(d1, a);
    a.failStart = 'Unknown task "no-such-task"';
    const bad = request(db, 'run', 'no-such-task');
    await p.tick();
    expect(req(db, bad)).toMatchObject({ status: 'failed', message: a.failStart });
    a.failStart = undefined;
    const r = request(db, 'run', 'weekly-review');
    await p.tick();
    Object.assign(a.runs.get(100)!, { status: 'timed_out', error: 'Stopped after 20 min' });
    await p.tick();
    expect(req(db, r)).toMatchObject({ status: 'failed', message: 'Stopped after 20 min' });
    expect(JSON.parse(String(req(db, r).result_json)).runStatus).toBe('timed_out');
  });

  it('cancel: a cancelled request is never picked up; cancel-run stops the PC run', async () => {
    const { db, d1 } = fakeCloud(); const a = fakeActions(); const p = poller(d1, a);
    const gone = request(db, 'run', 'weekly-review');
    db.prepare("UPDATE run_requests SET status = 'cancelled' WHERE id = ?").run(gone);
    await p.tick();
    expect(a.calls).toEqual([]);
    const r = request(db, 'run', 'weekly-review');
    await p.tick();
    const c = request(db, 'cancel-run', null, { runId: 100 });
    await p.tick();
    expect(req(db, c)).toMatchObject({ status: 'done', message: 'Run #100: cancelled' });
    await p.tick();
    expect(req(db, r)).toMatchObject({ status: 'failed' });
    expect(req(db, gone).status).toBe('cancelled');
  });

  it('the claim is atomic: two pollers, one request, one start', async () => {
    const { db, d1 } = fakeCloud(); const a = fakeActions(); const b = fakeActions();
    const id = request(db, 'run', 'weekly-review');
    await Promise.all([poller(d1, a).tick(), poller(d1, b).tick()]);
    expect(a.calls.length + b.calls.length).toBe(1);
    expect(req(db, id).status).toBe('started');
  });

  it('after a restart: a request without its run fails with a clear message; one with its run is followed', async () => {
    const { db, d1 } = fakeCloud(); const a = fakeActions();
    const lost = request(db, 'paper-emails', null, { company: 'AMD' });
    const kept = request(db, 'run', 'weekly-review');
    db.prepare("UPDATE run_requests SET status = 'started' WHERE id = ?").run(lost);
    db.prepare("UPDATE run_requests SET status = 'started', local_run_id = 7 WHERE id = ?").run(kept);
    a.runs.set(7, { id: 7, status: 'succeeded', summary: 'Done', counters: {} });
    await poller(d1, a).tick();
    expect(req(db, lost)).toMatchObject({ status: 'failed' });
    expect(String(req(db, lost).message)).toMatch(/restarted/);
    expect(req(db, kept)).toMatchObject({ status: 'done', message: 'Done' });
  });
});

describe('website queue: the real RunManager with the fake claude', () => {
  let fx: Fixture | null = null; let runs: RunManager | null = null;
  afterEach(() => { runs?.shutdown(); fx?.cleanup(); clearPreflightCache(); fx = null; runs = null; });

  it('"Process new jobs" from the website runs like the dashboard button and ends done with the ranked count', async () => {
    fx = makeFixture();
    importLocal(fx.ctx);
    fakeScenario(fx.cfg.dataDir, 'success');
    ensureSyncTables(fx.db); // registered with the cloud (index 0): the poller only works then
    fx.db.prepare("INSERT INTO cloud_sync_state(key, value) VALUES ('machine.idx', '0')").run();
    ({ runs } = createApp(fx.ctx, { exportDelayMs: 0, runOptions: { pipelines: {} } }));
    const { db, d1 } = fakeCloud();
    const p = poller(d1, realActions(fx.ctx, runs, null));
    const id = request(db, 'run', 'process-new-jobs', { limit: 2 });
    await p.tick();
    const started = req(db, id);
    expect(started.status).toBe('started');
    await runs.whenIdle();
    await p.tick();
    const done = req(db, id);
    expect(done.status).toBe('done');
    const result = JSON.parse(String(done.result_json));
    expect(result).toMatchObject({ runStatus: 'succeeded', synced: false });
    expect(result.counters.ranked).toBe(2);
    // the run row reached the website's runs table
    expect(db.prepare('SELECT status FROM runs WHERE id = ?').get(Number(started.local_run_id))).toEqual({ status: 'succeeded' });
  }, 30_000);
});
