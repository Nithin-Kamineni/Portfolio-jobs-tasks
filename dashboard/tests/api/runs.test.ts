// Runs API with the fake claude (tests/fakes/claude.mjs): it really calls the CLI, so database effects are real.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../server/app';
import { importLocal } from '../../server/sync';
import { insertRun, updateRun, getRun } from '../../server/runs/store';
import { clearPreflightCache } from '../../server/runs/claude';
import { RunManager } from '../../server/runs/runner';
import { fakeCalls, fakeScenario, makeFixture, type Fixture } from '../helpers';
import type { Run } from '../../shared/types';

let fx: Fixture;
let app: ReturnType<typeof createApp>['app'];
let runs: RunManager;

function setup(scenario = 'success', mutate?: (f: Fixture) => void) {
  fx = makeFixture();
  mutate?.(fx);
  importLocal(fx.ctx);
  fakeScenario(fx.cfg.dataDir, scenario);
  // These tests are about single Claude runs; the pipelines (P4) have their own tests (pipeline.test.ts).
  ({ app, runs } = createApp(fx.ctx, { exportDelayMs: 0, runOptions: { pipelines: {} } }));
  return fx;
}

afterEach(() => { runs?.shutdown(); fx?.cleanup(); clearPreflightCache(); });

const waitFor = async (fn: () => boolean, ms = 15000) => {
  const t = Date.now();
  while (!fn()) { if (Date.now() - t > ms) throw new Error('timed out waiting'); await new Promise((r) => setTimeout(r, 50)); }
};
const pidAlive = (pid: number | null) => { if (!pid) return false; try { process.kill(pid, 0); return true; } catch { return false; } };

describe('runs: create, progress, result', () => {
  it('process-new-jobs --limit 2 ranks 2 new jobs; counters, summary, usage, log, run tag; no API key', async () => {
    setup();
    const r = await request(app).post('/api/runs').send({ task: 'process-new-jobs', params: { limit: 2 } }).expect(201);
    expect(r.body.run).toMatchObject({ task: 'process-new-jobs', status: 'queued', params: { limit: 2 }, label: 'Process new jobs' });
    await runs.whenIdle();
    const run: Run = (await request(app).get(`/api/runs/${r.body.run.id}`).expect(200)).body;
    expect(run).toMatchObject({ status: 'succeeded', result_subtype: 'success', num_turns: 3, usage_usd: 0.0123, error: null });
    expect(run.summary).toMatch(/Ranked 2 jobs/);
    expect(run.session_id).toBeTruthy();
    expect(run.progress.counters.ranked).toBe(2);
    expect(run.progress.target).toBe(2);
    expect(run.progress.usage?.input_tokens).toBeGreaterThan(0);
    expect(run.progress.steps.map((s) => s.text)).toEqual(expect.arrayContaining(['Listing jobs', 'Finished']));
    const ranked = fx.db.prepare("SELECT id FROM jobs WHERE status = 'ranked'").all();
    expect(ranked).toHaveLength(2);
    const ev = fx.db.prepare("SELECT detail_json FROM events WHERE kind = 'rank'").all() as { detail_json: string }[];
    expect(ev.map((e) => JSON.parse(e.detail_json).run)).toEqual([run.id, run.id]);
    const st = fx.db.prepare("SELECT detail_json FROM events WHERE kind = 'status'").all() as { detail_json: string }[];
    expect(JSON.parse(st[0].detail_json).by).toBe(`claude:run:${run.id}`);
    expect(fs.existsSync(path.join(fx.cfg.dataDir, 'runs', `${run.id}.jsonl`))).toBe(true);
    expect((await request(app).get(`/api/runs/${run.id}/log`).expect(200)).text).toMatch(/"type":"result"/);
    const call = fakeCalls(fx.cfg.dataDir)[0];
    expect(call.env).toEqual({ JOBWATCHER_RUN_ID: String(run.id), ANTHROPIC_API_KEY: null });
    expect(call.argv.slice(0, 2)[0]).toBe('-p');
    expect(call.argv).toContain('--no-chrome');
    expect(fs.existsSync(path.join(fx.root, 'data', 'scratch', `run-${run.id}`))).toBe(true);
    const list = (await request(app).get('/api/runs').expect(200)).body;
    expect(list.runs.map((x: Run) => x.id)).toEqual([run.id]);
    expect(list.paused).toBeNull();
    // tracker.csv regenerated after the run
    expect(fs.readFileSync(path.join(fx.root, 'jobs', 'tracker.csv'), 'utf8')).toMatch(/Fake rank/);
  });

  it('rejects unknown tasks and bad parameters', async () => {
    setup();
    await request(app).post('/api/runs').send({ task: 'rm -rf' }).expect(400);
    await request(app).post('/api/runs').send({}).expect(400);
    const bad = await request(app).post('/api/runs').send({ task: 'prepare-job', params: { jobId: 'nope' } }).expect(404);
    expect(bad.body.error).toMatch(/No job/);
    await request(app).post('/api/runs').send({ task: 'process-new-jobs', params: { limit: 'lots' } }).expect(400);
    await request(app).get('/api/runs/999').expect(404);
  });

  it('dedupes: the same task while one is queued/running returns the existing run', async () => {
    setup();
    const a = await request(app).post('/api/runs').send({ task: 'follow-ups' }).expect(201);
    const b = await request(app).post('/api/runs').send({ task: 'follow-ups' }).expect(200);
    expect(b.body).toMatchObject({ deduped: true, run: { id: a.body.run.id } });
    // a different job for a per-job task is not a duplicate
    const p1 = await request(app).post('/api/runs').send({ task: 'prepare-job', params: { jobId: 'wd:micron:JR111017' } }).expect(201);
    const p2 = await request(app).post('/api/runs').send({ task: 'prepare-job', params: { jobId: 'wd:nvidia:JR2026584' } }).expect(201);
    expect(p1.body.run.id).not.toBe(p2.body.run.id);
    await runs.whenIdle();
    // finished → a new one may start
    await request(app).post('/api/runs').send({ task: 'follow-ups' }).expect(201);
    await runs.whenIdle();
  });

  it('queue: runs one at a time, in order', async () => {
    setup();
    let maxRunning = 0;
    runs.on('run', () => {
      const n = (fx.db.prepare("SELECT count(*) n FROM runs WHERE status = 'running'").get() as { n: number }).n;
      maxRunning = Math.max(maxRunning, n);
    });
    const ids = [];
    for (const task of ['follow-ups', 'weekly-review', 'fix-watcher-errors']) ids.push((await request(app).post('/api/runs').send({ task }).expect(201)).body.run.id);
    await runs.whenIdle();
    expect(maxRunning).toBe(1);
    const got = ids.map((id) => getRun(fx.db, id));
    expect(got.map((r) => r.status)).toEqual(['succeeded', 'succeeded', 'succeeded']);
    expect(got[0].finished_at! <= got[1].started_at!).toBe(true);
    expect(got[1].finished_at! <= got[2].started_at!).toBe(true);
    expect(got[1].summary).toMatch(/Weekly review/);
  });
});

describe('runs: SSE, cancel, timeout, failures', () => {
  it('GET /api/runs/:id/events streams the run and ends with "done"', async () => {
    setup();
    const { run } = (await request(app).post('/api/runs').send({ task: 'weekly-review' }).expect(201)).body;
    const res = await request(app).get(`/api/runs/${run.id}/events`).buffer(true).parse((r, cb) => { let d = ''; r.on('data', (c: Buffer) => { d += c; }); r.on('end', () => cb(null, d)); });
    expect(res.headers['content-type']).toMatch(/text\/event-stream/);
    const text = String(res.body);
    expect(text).toMatch(/event: run\ndata: /);
    expect(text).toMatch(/event: done\ndata: .*"status":"succeeded"/);
    const statuses = [...text.matchAll(/"status":"(\w+)"/g)].map((m) => m[1]);
    expect(statuses).toContain('running');
  });

  it('cancel: a hanging run is killed and marked cancelled; cancelling a queued run works too', async () => {
    setup('hang');
    const { run } = (await request(app).post('/api/runs').send({ task: 'follow-ups' }).expect(201)).body;
    const queued = (await request(app).post('/api/runs').send({ task: 'weekly-review' }).expect(201)).body.run;
    await waitFor(() => getRun(fx.db, run.id).status === 'running' && getRun(fx.db, run.id).progress.steps.length > 0);
    const pid = getRun(fx.db, run.id).pid;
    expect(pidAlive(pid)).toBe(true);
    await request(app).post(`/api/runs/${queued.id}/cancel`).expect(200);
    expect(getRun(fx.db, queued.id).status).toBe('cancelled');
    await request(app).post(`/api/runs/${run.id}/cancel`).expect(200);
    await runs.whenIdle();
    expect(getRun(fx.db, run.id)).toMatchObject({ status: 'cancelled', error: 'Cancelled' });
    await waitFor(() => !pidAlive(pid));
    await request(app).post(`/api/runs/${run.id}/cancel`).expect(409);
  });

  it('timeout: stops after the task time limit (config) as timed_out', async () => {
    setup('hang', (f) => { f.cfg.runs.tasks['follow-ups'] = { timeoutMin: 0.02 }; });
    const { run } = (await request(app).post('/api/runs').send({ task: 'follow-ups' }).expect(201)).body;
    await runs.whenIdle();
    expect(getRun(fx.db, run.id)).toMatchObject({ status: 'timed_out', error: expect.stringMatching(/time limit/) });
  });

  it('crash → failed with Claude\'s error output; max turns → needs_user (Continue)', async () => {
    setup('crash');
    const a = (await request(app).post('/api/runs').send({ task: 'follow-ups' }).expect(201)).body.run;
    await runs.whenIdle();
    expect(getRun(fx.db, a.id)).toMatchObject({ status: 'failed', error: expect.stringMatching(/code 2.*something broke/) });
    fakeScenario(fx.cfg.dataDir, 'max_turns');
    const b = (await request(app).post('/api/runs').send({ task: 'process-new-jobs', params: { limit: 3 } }).expect(201)).body.run;
    await runs.whenIdle();
    expect(getRun(fx.db, b.id)).toMatchObject({ status: 'needs_user', result_subtype: 'error_max_turns', error: expect.stringMatching(/turns.*Continue/) });
  });

  it('Chrome task with the extension not connected fails fast with a clear message', async () => {
    setup('chrome_disconnected');
    const r = (await request(app).post('/api/runs').send({ task: 'check-manual-companies', params: { company: 'Meta' } }).expect(201)).body.run;
    await runs.whenIdle();
    const done = getRun(fx.db, r.id);
    expect(done).toMatchObject({ status: 'failed', error: expect.stringMatching(/Open Chrome and make sure the Claude extension is signed in/) });
    expect(fakeCalls(fx.cfg.dataDir)[0].argv).toContain('--chrome');
  });

  it('plan usage limit → needs_user and the queue pauses (resume-queue clears it)', async () => {
    setup('usage_limit');
    const a = (await request(app).post('/api/runs').send({ task: 'follow-ups' }).expect(201)).body.run;
    await runs.whenIdle();
    expect(getRun(fx.db, a.id)).toMatchObject({ status: 'needs_user', error: expect.stringMatching(/plan usage limit/) });
    const b = (await request(app).post('/api/runs').send({ task: 'weekly-review' }).expect(201)).body.run;
    await new Promise((r) => setTimeout(r, 300));
    expect(getRun(fx.db, b.id).status).toBe('queued');
    expect((await request(app).get('/api/runs')).body.paused).toMatchObject({ reason: expect.stringMatching(/usage limit/) });
    fakeScenario(fx.cfg.dataDir, 'success');
    await request(app).post('/api/runs/resume-queue').send({}).expect(200);
    await runs.whenIdle();
    expect(getRun(fx.db, b.id).status).toBe('succeeded');
  });

  it('denied tools are counted and shown', async () => {
    setup('denied');
    const a = (await request(app).post('/api/runs').send({ task: 'follow-ups' }).expect(201)).body.run;
    await runs.whenIdle();
    const done = getRun(fx.db, a.id);
    expect(done.progress.counters.denied).toBe(1);
    expect(done.progress.steps.some((s) => s.kind === 'error' && /Not allowed/.test(s.text))).toBe(true);
  });
});

describe('runs: continue, preflight, restart', () => {
  it('continue resumes the Claude session with the owner\'s note', async () => {
    setup();
    const a = (await request(app).post('/api/runs').send({ task: 'follow-ups' }).expect(201)).body.run;
    await runs.whenIdle();
    const session = getRun(fx.db, a.id).session_id;
    await request(app).post(`/api/runs/${a.id}/continue`).send({ note: 'Also draft one for Sam' }).expect(201);
    await runs.whenIdle();
    const calls = fakeCalls(fx.cfg.dataDir);
    const last = calls[calls.length - 1].argv;
    expect(last[last.indexOf('--resume') + 1]).toBe(session);
    expect(last[1]).toMatch(/the owner says: Also draft one for Sam/);
    const second = runs.list(5)[0];
    expect(second).toMatchObject({ task: 'follow-ups', status: 'succeeded', summary: 'Continued and finished.' });
    // a run that never got a session can't be continued
    const never = insertRun(fx.db, 'follow-ups', {}); updateRun(fx.db, never.id, { status: 'failed' });
    await request(app).post(`/api/runs/${never.id}/continue`).send({}).expect(409);
  });

  it('preflight: the fake works; a missing command gives the setup message', async () => {
    setup();
    const ok = (await request(app).get('/api/runs/preflight').expect(200)).body;
    expect(ok).toMatchObject({ ok: true, version: '9.9.9 (Fake Claude)', message: null });
    fx.cfg.claudeCommand = 'no-such-claude-binary-xyz';
    clearPreflightCache();
    const bad = (await request(app).get('/api/runs/preflight').expect(200)).body;
    expect(bad).toMatchObject({ ok: false, resolved: null });
    expect(bad.message).toMatch(/not found.*run `claude`, log in once, then try again/);
    // and a run with a missing binary fails with the same advice instead of crashing
    const r = (await request(app).post('/api/runs').send({ task: 'follow-ups' }).expect(201)).body.run;
    await runs.whenIdle();
    expect(getRun(fx.db, r.id)).toMatchObject({ status: 'failed', error: expect.stringMatching(/log in once/) });
  });

  it('restart: a run whose process is gone is marked failed', async () => {
    setup();
    const r = insertRun(fx.db, 'follow-ups', {});
    updateRun(fx.db, r.id, { status: 'running', pid: 999999 });
    expect(runs.recover()).toBe(1);
    expect(getRun(fx.db, r.id)).toMatchObject({ status: 'failed', error: expect.stringMatching(/restarted/) });
  });
});

describe('CLI run / runs', () => {
  it('run <task> --param k=v --local runs in-process and waits; runs lists it', () => {
    setup();
    fx.db.close();
    const CLI = path.resolve(__dirname, '../../cli/index.js');
    const env = { ...process.env, JOBWATCHER_REPO: fx.root, JOBWATCHER_DATA: fx.cfg.dataDir, JOBWATCHER_DB: '', JOBWATCHER_GIT: 'off', JOBWATCHER_CLAUDE: fx.cfg.claudeCommand, JOBWATCHER_NO_FETCH: '1' };
    // in the CLI, process-new-jobs is the pipeline too: 3 new jobs → quick rank (2 per batch) → Opus check of the 3 with quick fit ≥ 30
    const r = spawnSync(process.execPath, [CLI, 'run', 'process-new-jobs', '--param', 'limit=2', '--param', 'skipManual=true', '--local'], { encoding: 'utf8', env, timeout: 90000 });
    const out = JSON.parse(r.stdout);
    expect(out).toMatchObject({ via: 'cli', run: { task: 'process-new-jobs', status: 'succeeded', params: { limit: 2, skipManual: true }, counters: { ranked: 6 } } });
    expect(out.run.summary).toMatch(/Ranked 3 new jobs.*0 by rules, 3 quick-ranked, 3 checked by Opus/);
    const list = JSON.parse(spawnSync(process.execPath, [CLI, 'runs'], { encoding: 'utf8', env }).stdout);
    expect(list.runs[0]).toMatchObject({ id: out.run.id, status: 'succeeded' });
    const bad = JSON.parse(spawnSync(process.execPath, [CLI, 'run', 'process-new-jobs', '--param', 'limit'], { encoding: 'utf8', env }).stdout);
    expect(bad.error).toMatch(/key=value/);
    const nested = JSON.parse(spawnSync(process.execPath, [CLI, 'run', 'follow-ups', '--local'], { encoding: 'utf8', env: { ...env, JOBWATCHER_RUN_ID: '3' } }).stdout);
    expect(nested.error).toMatch(/cannot start another run/);
  });
});
