// P4: each posting once (merge only the same posting; re-posts stay visible and linked), `job add`, manual checks,
// rule-based pre-ranking, compact ranking cards, and the "Process new jobs" pipeline with the fake claude.
import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../server/app';
import { importLocal } from '../../server/sync';
import { importInboxText, runDedupeBackfill, DEDUPE_BACKFILL_KEY, upsertJobs } from '../../server/importer';
import { getJob, listJobs, rankJob, setClock, setStatus, updateSettings } from '../../server/repo';
import { addManualJob, manualCompanies, markManualChecked } from '../../server/manual';
import { prerank, rankingCards } from '../../server/ranking';
import { getRun, listRuns } from '../../server/runs/store';
import type { RunManager } from '../../server/runs/runner';
import { fakeCalls, fakeScenario, inboxLine, makeFixture, type Fixture } from '../helpers';

let fx: Fixture;
afterEach(() => { fx?.cleanup(); setClock(() => new Date()); });

const WD_URL = 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/US-CA-Santa-Clara/PhD-Research-Intern_JR2026584';

describe('each posting once (§3.9)', () => {
  beforeEach(() => { fx = makeFixture(); importLocal(fx.ctx); });

  it('the same posting from the company feed and SimplifyJobs → one row; re-importing never recreates it', () => {
    const n = importInboxText(fx.db, 'jobs/inbox/2026-09-30_1200.jsonl', [
      inboxLine({ id: 'simplify:dup-1', company: 'NVIDIA', title: 'PhD Research Intern, AI Accelerator Design and VLSI', url: `${WD_URL}?utm_source=Simplify&ref=Simplify`, source: 'SimplifyJobs', description: 'Simplify copy' }),
      inboxLine({ id: 'simplify:dup-2', company: 'Micron', title: 'Micron AI intern', url: 'https://micron.wd1.myworkdayjobs.com/en-US/External/job/Folsom-CA/Intern---AI-Hardware_JR111017' }),
    ].join('\n'));
    expect(n).toBe(0);
    expect(listJobs(fx.db).map((j) => j.id).sort()).toEqual(['simplify:abc-1', 'wd:micron:JR111017', 'wd:nvidia:JR2026584']);
    expect(getJob(fx.db, 'wd:nvidia:JR2026584').description).toBe('Simplify copy'); // an empty field was filled from the copy
    expect(fx.db.prepare('SELECT alias_id, job_id FROM job_aliases ORDER BY alias_id').all()).toEqual([
      { alias_id: 'simplify:dup-1', job_id: 'wd:nvidia:JR2026584' }, { alias_id: 'simplify:dup-2', job_id: 'wd:micron:JR111017' },
    ]);
    expect(importInboxText(fx.db, 'jobs/inbox/2026-09-30_1300.jsonl', inboxLine({ id: 'simplify:dup-1', url: 'https://other.example/moved' }))).toBe(0);
    expect(listJobs(fx.db)).toHaveLength(3);
  });

  it('a re-posted role with a new id: a second, visible, rankable job linked to the old one; the old decision is untouched', () => {
    setStatus(fx.db, 'wd:nvidia:JR2026584', 'skip');
    importInboxText(fx.db, 'jobs/inbox/2026-10-15_1200.jsonl', inboxLine({
      id: 'wd:nvidia:JR2099999', company: 'NVIDIA', title: 'PhD Research Intern - AI Accelerator Design & VLSI (Summer 2027)',
      url: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/US-CA-Santa-Clara/PhD-Research-Intern_JR2099999', first_seen: '2026-10-15T12:00:00.000Z',
    }));
    const re = getJob(fx.db, 'wd:nvidia:JR2099999');
    expect(re).toMatchObject({ status: 'new', previous_posting_id: 'wd:nvidia:JR2026584' });
    expect(re.previous_posting).toMatchObject({ id: 'wd:nvidia:JR2026584', status: 'skip' });
    expect(getJob(fx.db, 'wd:nvidia:JR2026584').status).toBe('skip');
    expect(listJobs(fx.db, { forRanking: true }).map((j) => j.id)).toContain('wd:nvidia:JR2099999');
  });

  it('the same title posted the same day (parallel postings, e.g. two locations) is not a re-post', () => {
    importInboxText(fx.db, 'jobs/inbox/a.jsonl', [
      inboxLine({ id: 'x:1', company: 'Intel', title: 'Module Engineering PhD Intern', first_seen: '2026-09-30T10:00:00.000Z' }),
      inboxLine({ id: 'x:2', company: 'Intel', title: 'Module Engineering PhD Intern', first_seen: '2026-09-30T10:00:00.000Z' }),
    ].join('\n'));
    expect(getJob(fx.db, 'x:2').previous_posting_id).toBeNull();
  });

  it('backfill (once): merges exact duplicates already in the database, keeps the feed row with the copy\'s progress, moves outreach, links re-posts', () => {
    // insert duplicates the old way (as v1 did), bypassing the new merge
    const raw = fx.db.prepare(`INSERT INTO jobs(id, company, title, url, first_seen, status, fit_score) VALUES (?,?,?,?,?,?,?)`);
    raw.run('simplify:old-copy', 'NVIDIA', 'PhD Research Intern (copy)', `${WD_URL}?utm_source=Simplify`, '2026-09-29T22:09:00.000Z', 'apply_direct', 80);
    raw.run('simplify:old-intel', 'Intel', 'Software Intern', 'https://intel.wd1.myworkdayjobs.com/en-us/external/job/US-Oregon/Soft_JR0287314', '2026-09-29T22:09:00.000Z', 'ranked', 40);
    raw.run('wd:intel:JR0287314', 'Intel', 'Software Solutions PhD Intern', 'https://intel.wd1.myworkdayjobs.com/External/job/US-Oregon/Software-Solutions_JR0287314', '2026-09-29T22:09:00.000Z', 'ranked', 45);
    raw.run('wd:micron:JR999', 'Micron', 'Intern - AI Hardware and Memory Systems', 'https://micron.example/new', '2026-10-20T00:00:00.000Z', 'new', null);
    fx.db.prepare("INSERT INTO contacts(name, company, relationship, created_at, updated_at) VALUES ('Sam','NVIDIA','friend','x','x')").run();
    fx.db.prepare("INSERT INTO outreach(type, contact_id, job_id, body, created_at, updated_at) VALUES ('referral', 1, 'simplify:old-copy', 'hi', 'x', 'x')").run();
    fx.db.prepare('DELETE FROM imports WHERE file = ?').run(DEDUPE_BACKFILL_KEY);
    const out = runDedupeBackfill(fx.db)!;
    expect(out.merged).toEqual(expect.arrayContaining([
      { kept: 'wd:nvidia:JR2026584', removed: 'simplify:old-copy', reason: 'same URL' }, // the company feed row is kept…
      { kept: 'wd:intel:JR0287314', removed: 'simplify:old-intel', reason: 'same requisition number' },
    ]));
    expect(out.merged).toHaveLength(2);
    expect(fx.db.prepare("SELECT status FROM jobs WHERE id = 'wd:nvidia:JR2026584'").get()).toEqual({ status: 'apply_direct' }); // …with the copy's decision
    expect(fx.db.prepare("SELECT job_id FROM outreach").get()).toEqual({ job_id: 'wd:nvidia:JR2026584' });
    expect(getJob(fx.db, 'wd:micron:JR999').previous_posting_id).toBe('wd:micron:JR111017');
    expect(out.linked).toBe(1);
    expect(runDedupeBackfill(fx.db)).toBeNull(); // only once
    // one event per backfill: the fixture's first import, and the forced re-run above
    expect(fx.db.prepare("SELECT count(*) n FROM events WHERE kind = 'dedupe_backfill'").get()).toEqual({ n: 2 });
  });
});

describe('job add (manual postings)', () => {
  beforeEach(() => { fx = makeFixture(); importLocal(fx.ctx); });
  const desc = 'PhD research intern on the MTIA accelerator team: processing-in-memory, HBM memory systems and computer architecture research. '.repeat(3);

  it('adds a matching posting as new with watcher score, tags and flags; the same URL again is a no-op', () => {
    const r = addManualJob(fx.ctx, { company: 'meta', title: 'PhD Research Intern, AI Accelerator Architecture', url: 'https://www.metacareers.com/jobs/111/?utm_source=x', location: 'Menlo Park, CA', posted: '2026-09-28', description: desc });
    expect(r.added).toBe(true);
    expect(r.job).toMatchObject({ company: 'Meta', status: 'new', source: 'manual:Meta', posted_date: '2026-09-28' });
    expect(r.job.id).toMatch(/^manual:meta:[0-9a-f]{12}$/);
    expect(r.job.score).toBeGreaterThan(10);
    expect(r.job.tags).toEqual(expect.arrayContaining(['PhD', 'Memory/PIM', 'AI accelerator']));
    const again = addManualJob(fx.ctx, { company: 'Meta', title: 'PhD Research Intern, AI Accelerator Architecture', url: 'https://metacareers.com/jobs/111', location: 'Menlo Park, CA', description: desc });
    expect(again).toMatchObject({ added: false, reason: 'already added earlier' });
    expect(listJobs(fx.db, { company: 'Meta' })).toHaveLength(1);
  });

  it('a posting the watcher already has (URL variant) → no second row', () => {
    const r = addManualJob(fx.ctx, { company: 'NVIDIA', title: 'PhD Research Intern, AI Accelerator Design and VLSI - 2027', url: `${WD_URL}?source=careers`, location: 'Santa Clara, CA', description: desc });
    expect(r).toMatchObject({ added: false, duplicateOf: 'wd:nvidia:JR2026584' });
    expect(listJobs(fx.db)).toHaveLength(3);
  });

  it('rejects non-matching postings with a reason (title filter, non-US, domain rule) and bad input', () => {
    expect(() => addManualJob(fx.ctx, { company: 'Meta', title: 'Marketing Intern', url: 'https://m.example/1', location: 'Menlo Park, CA', description: desc })).toThrow(/title filter/);
    expect(() => addManualJob(fx.ctx, { company: 'Meta', title: 'Hardware Intern', url: 'https://m.example/2', location: 'Bangalore, India', description: desc })).toThrow(/not a US location/);
    expect(() => addManualJob(fx.ctx, { company: 'Meta', title: 'Research Intern', url: 'https://m.example/3', location: 'Remote, US', description: 'Help our sales team with spreadsheets and customer calls. '.repeat(5) })).toThrow(/domain rule/);
    expect(() => addManualJob(fx.ctx, { company: 'Meta', title: 'Hardware Intern', url: 'javascript:alert(1)' })).toThrow(/http\(s\) URL/);
    expect(() => addManualJob(fx.ctx, { title: 'x', url: 'https://x.example' })).toThrow(/--company/);
  });

  it('manual checks: recorded per company; due when older than the setting (0 = always)', () => {
    setClock(() => new Date('2026-09-30T12:00:00Z'));
    expect(manualCompanies(fx.db, 24).map((c) => [c.name, c.due])).toEqual([['Meta', true], ['Tesla (AI hardware)', true]]); // Groq is disabled
    markManualChecked(fx.db, 'meta', { found: 3, added: 1, result: 'ok' });
    expect(manualCompanies(fx.db, 24, new Date('2026-09-30T20:00:00Z')).find((c) => c.name === 'Meta')).toMatchObject({ due: false, last: { result: 'ok', found: 3, added: 1 } });
    expect(manualCompanies(fx.db, 24, new Date('2026-10-01T13:00:00Z')).find((c) => c.name === 'Meta')?.due).toBe(true);
    expect(manualCompanies(fx.db, 0, new Date('2026-09-30T12:01:00Z')).find((c) => c.name === 'Meta')?.due).toBe(true);
    expect(() => markManualChecked(fx.db, 'Nope Corp', {})).toThrow(/Unknown company/);
    expect(() => markManualChecked(fx.db, 'Meta', { result: 'great' })).toThrow(/ok, blocked or error/);
  });
});

describe('pre-ranking and cards', () => {
  beforeEach(() => { fx = makeFixture(); importLocal(fx.ctx); });

  it('prerank: fetches missing descriptions, closes gone postings, settles clear cases by rule; never touches scored jobs', async () => {
    importInboxText(fx.db, 'jobs/inbox/b.jsonl', inboxLine({ id: 'ops:1', company: 'Micron', title: 'Business Operations Intern', description: 'Support finance and sales operations with spreadsheets, reports and customer meetings. '.repeat(4) }));
    rankJob(fx.db, 'simplify:abc-1', 40, 'already scored');
    const fetched: string[] = [];
    const r = await prerank(fx.ctx, {
      delayMs: 0,
      fetcher: async (j) => {
        fetched.push(j.id);
        if (j.id === 'wd:nvidia:JR2026584') return { description: '<p>This role requires U.S. citizenship and an active security clearance. Hardware design of AI accelerators.</p>' };
        throw new Error('HTTP 404 for https://micron.example');
      },
    });
    expect(fetched.sort()).toEqual(['wd:micron:JR111017', 'wd:nvidia:JR2026584']);
    expect(r.closed).toEqual(['wd:micron:JR111017']);
    expect(getJob(fx.db, 'wd:micron:JR111017').status).toBe('closed');
    expect(r.settled).toEqual(expect.arrayContaining([
      { id: 'wd:nvidia:JR2026584', fit: 3, reason: expect.stringMatching(/citizenship/) },
      { id: 'ops:1', fit: 5, reason: 'Domain rule: no hardware topic' },
    ]));
    expect(getJob(fx.db, 'ops:1')).toMatchObject({ status: 'ranked', fit_score: 5, rank_stage: 'rule', rank_model: 'rules' });
    expect(getJob(fx.db, 'simplify:abc-1')).toMatchObject({ fit_score: 40, rank_stage: null });
    expect(r.toRank).toBe(0);
  });

  it('cards list only new, unscored jobs (highest watcher score first); a final score is never overwritten by a quick one', () => {
    importInboxText(fx.db, 'jobs/inbox/c.jsonl', inboxLine({ id: 'c:1', title: 'PIM Intern', score: 70, description: '<h3>Responsibilities</h3><ul><li>Build PIM</li></ul><h3>Benefits</h3><p>401(k)</p>' }));
    rankJob(fx.db, 'wd:micron:JR111017', 80, 'x', { stage: 'quick' });
    const c = rankingCards(fx.ctx, 2);
    expect(c.cards.map((x) => x.id)).toEqual(['c:1', 'wd:nvidia:JR2026584']);
    expect(c).toMatchObject({ count: 2, remaining: 1 });
    expect(c.cards[0].text).toBe('Responsibilities: Build PIM');
    rankJob(fx.db, 'c:1', 77, 'checked', { stage: 'final', model: 'opus' });
    expect(() => rankJob(fx.db, 'c:1', 50, 'quick again', { stage: 'quick' })).toThrow(/already has a final/);
    expect(getJob(fx.db, 'c:1')).toMatchObject({ fit_score: 77, rank_stage: 'final', rank_model: 'opus' });
    expect(() => rankJob(fx.db, 'c:1', 50, 'x', { stage: 'best' })).toThrow(/--stage must be/);
  });
});

// ---------- the pipeline, end to end with the fake claude ----------
describe('"Process new jobs" pipeline (fake claude)', () => {
  let app: ReturnType<typeof createApp>['app'];
  let runs: RunManager;
  const DESCS: Record<string, string> = {
    'wd:micron:JR111017': '<h3>What you will do</h3><p>PhD intern: HBM memory systems and processing-in-memory architecture research.</p>',
    'wd:nvidia:JR2026584': '<p>Requires U.S. citizenship and an active security clearance. VLSI hardware design.</p>',
  };
  function setup(scenario = 'success') {
    fx = makeFixture();
    importLocal(fx.ctx);
    importInboxText(fx.db, 'jobs/inbox/d.jsonl', inboxLine({ id: 'ops:1', company: 'Micron', title: 'Business Operations Intern', score: 5, description: 'Support finance and sales operations with spreadsheets, reports and customer meetings. '.repeat(4) }));
    fakeScenario(fx.cfg.dataDir, scenario);
    ({ app, runs } = createApp(fx.ctx, {
      exportDelayMs: 0,
      fetchDescription: async (j) => { if (DESCS[j.id]) return { description: DESCS[j.id] }; throw new Error('HTTP 404 for x'); },
    }));
  }
  afterEach(() => runs?.shutdown());
  const start = async (params: Record<string, unknown> = {}) => {
    const { run } = (await request(app).post('/api/runs').send({ task: 'process-new-jobs', params }).expect(201)).body;
    await runs.whenIdle();
    return (await request(app).get(`/api/runs/${run.id}`)).body;
  };
  const steps = (r: { progress: { pipeline: { key: string; status: string; detail?: string }[] } }) => Object.fromEntries(r.progress.pipeline.map((s) => [s.key, s.status]));

  it('sync → manual companies (one Chrome run each) → rules → quick rank → Opus final check only for promising quick scores', async () => {
    setup();
    const r = await start();
    expect(r.status).toBe('succeeded');
    expect(steps(r)).toEqual({ sync: 'done', manual: 'done', rules: 'done', quick: 'done', final: 'done' });
    const kids = r.children as { task: string; params: Record<string, unknown>; status: string }[];
    expect(kids.map((k) => `${k.task}${k.params.company ? `:${k.params.company}` : ''}`)).toEqual([
      'check-manual-companies:Meta', 'check-manual-companies:Tesla (AI hardware)', 'quick-rank', 'final-check',
    ]);
    // the manual runs added one matching posting each (the fake also tried a non-matching one: rejected)
    const manual = listJobs(fx.db).filter((j) => j.id.startsWith('manual:'));
    expect(manual.map((j) => j.company).sort()).toEqual(['Meta', 'Tesla (AI hardware)']);
    expect(manual.every((j) => j.source.startsWith('manual:'))).toBe(true);
    // rules: citizenship (NVIDIA, 3), domain rule (ops, 5); gone posting (Etched 404) closed
    expect(getJob(fx.db, 'wd:nvidia:JR2026584')).toMatchObject({ fit_score: 3, rank_stage: 'rule' });
    expect(getJob(fx.db, 'ops:1')).toMatchObject({ fit_score: 5, rank_stage: 'rule' });
    expect(getJob(fx.db, 'simplify:abc-1').status).toBe('closed');
    // quick: fake fit = watcher score + 20; final check (fake: 77) only for quick ≥ 60
    const micron = getJob(fx.db, 'wd:micron:JR111017');
    expect(micron).toMatchObject({ rank_stage: 'final', fit_score: 77, rank_model: 'opus' });
    for (const j of manual) expect(getJob(fx.db, j.id).rank_stage).toBe((j.score ?? 0) + 20 >= fx.cfg.runs.finalMinFit ? 'final' : 'quick');
    const finalPrompt = fakeCalls(fx.cfg.dataDir).find((c) => c.argv[1].includes('Final-check step'))!.argv[1];
    expect(finalPrompt).toContain('wd:micron:JR111017');
    expect(finalPrompt).not.toContain('wd:nvidia:JR2026584');
    expect(r.summary).toMatch(/\*\*Ranked \d+ new jobs\*\*: 2 by rules, \d+ quick-ranked, \d+ checked by Opus\. 1 closed/);
    expect(r.summary).toMatch(/Manual companies: Meta: 1 added · Tesla \(AI hardware\): 1 added/);
    expect(r.summary).toMatch(/Top jobs[\s\S]*fit 77 \(checked\) · Micron/);
    // no spot-check step (removed 2026-10-17): the pipeline never waits for the owner
    expect(r.progress).not.toHaveProperty('calibrate');
    // counters and usage roll up from the child runs
    expect(r.progress.counters.ranked).toBeGreaterThanOrEqual(3);
    expect(r.usage_usd).toBeGreaterThan(0);
    // the child runs are not in the top-level history
    expect(listRuns(fx.db).map((x) => x.task)).toEqual(['process-new-jobs']);

    // second press: manual companies were checked < 24 h ago; nothing new → no Claude runs at all
    const before = fakeCalls(fx.cfg.dataDir).length;
    const again = await start();
    expect(steps(again)).toEqual({ sync: 'done', manual: 'skipped', rules: 'done', quick: 'skipped', final: 'skipped' });
    expect(again.progress.pipeline.find((s: { key: string }) => s.key === 'manual').detail).toMatch(/checked in the last 24 h/);
    expect(again.summary).toMatch(/^No new jobs to rank/);
    expect(fakeCalls(fx.cfg.dataDir).length).toBe(before);
  });

  it('manual step: a blocked site is reported, not a failure; setting 0 h checks on every press; skipManual skips it', async () => {
    setup('blocked_site');
    updateSettings(fx.db, fx.cfg.runs, { manualCheckEveryHours: 0 });
    const r = await start({ limit: 5 });
    expect(r.progress.pipeline.find((s: { key: string }) => s.key === 'manual').detail).toMatch(/Meta: blocked · Tesla \(AI hardware\): blocked/);
    expect(steps(r).manual).toBe('done');
    fakeScenario(fx.cfg.dataDir, 'success');
    const skip = await start({ skipManual: true });
    expect(steps(skip).manual).toBe('skipped');
  });

  it('Chrome not connected: the other companies are skipped, the rest of the pipeline still runs', async () => {
    setup('chrome_disconnected');
    const r = await start();
    expect(r.progress.pipeline.find((s: { key: string }) => s.key === 'manual').detail).toMatch(/Meta: Chrome not connected · Tesla \(AI hardware\): skipped \(Chrome not connected\)/);
    expect(r.children.filter((k: { task: string }) => k.task === 'check-manual-companies')).toHaveLength(1);
    expect(steps(r).rules).toBe('done');
  });

  it('a failed quick rank stops the pipeline cleanly (the final check is not run)', async () => {
    setup('crash');
    const r = await start({ skipManual: true });
    expect(r.status).toBe('failed');
    expect(steps(r)).toMatchObject({ sync: 'done', manual: 'skipped', rules: 'done', quick: 'failed', final: 'skipped' });
    expect(r.error).toMatch(/something broke/);
  });

  it('recheck: Opus re-checks ranked jobs with fit ≥ finalMinFit (30) that were never checked (the v1 backlog)', async () => {
    setup();
    rankJob(fx.db, 'wd:micron:JR111017', 92, 'v1 score'); // v1: no stage
    rankJob(fx.db, 'wd:nvidia:JR2026584', 40, 'v1 middling');
    rankJob(fx.db, 'ops:1', 5, 'v1 low');
    rankJob(fx.db, 'simplify:abc-1', 70, 'already final', { stage: 'final' });
    const r = await start({ recheck: true });
    expect(r.status).toBe('succeeded');
    expect(r.children.map((k: { task: string; params: { jobIds: string[] } }) => [k.task, k.params.jobIds])).toEqual([['final-check', ['wd:micron:JR111017', 'wd:nvidia:JR2026584']]]);
    expect(getJob(fx.db, 'wd:micron:JR111017')).toMatchObject({ fit_score: 77, rank_stage: 'final' });
    expect(getJob(fx.db, 'ops:1').rank_stage).toBeNull();
    expect(r.summary).toMatch(/Re-checked 2 ranked jobs with fit ≥ 30\*\* \(2 scores changed by 5 or more\)/);
  });


  it('"Check now": check-manual-companies without a company runs every manual company (a pipeline)', async () => {
    setup();
    const { run } = (await request(app).post('/api/runs').send({ task: 'check-manual-companies' }).expect(201)).body;
    await runs.whenIdle();
    const r = getRun(fx.db, run.id);
    expect(r.status).toBe('succeeded');
    expect(r.summary).toMatch(/Meta: 1 added[\s\S]*Tesla \(AI hardware\): 1 added/);
    expect(listRuns(fx.db, { parentId: run.id }).map((k) => k.params.company)).toEqual(['Meta', 'Tesla (AI hardware)']);
    expect(fs.existsSync(path.join(fx.cfg.dataDir, 'runs', `${run.id + 1}.jsonl`))).toBe(true);
  });

  it('cancelling the pipeline stops it (children too)', async () => {
    setup('hang');
    const { run } = (await request(app).post('/api/runs').send({ task: 'process-new-jobs' }).expect(201)).body;
    for (let i = 0; i < 100 && !listRuns(fx.db, { parentId: run.id }).some((k) => k.status === 'running'); i++) await new Promise((r) => setTimeout(r, 100));
    await request(app).post(`/api/runs/${run.id}/cancel`).expect(200);
    await runs.whenIdle();
    expect(getRun(fx.db, run.id).status).toBe('cancelled');
    expect(listRuns(fx.db, { parentId: run.id }).every((k) => ['cancelled', 'succeeded', 'failed'].includes(k.status))).toBe(true);
  });
});

describe('upsert keeps decisions', () => {
  it('re-importing an existing id never touches status, rank or notes', () => {
    fx = makeFixture(); importLocal(fx.ctx);
    rankJob(fx.db, 'wd:micron:JR111017', 88, 'great', { stage: 'final' });
    setStatus(fx.db, 'wd:micron:JR111017', 'applied');
    upsertJobs(fx.db, [{ id: 'wd:micron:JR111017', company: 'Micron', title: 'Changed title', url: 'https://x.example' }]);
    expect(getJob(fx.db, 'wd:micron:JR111017')).toMatchObject({ status: 'applied', fit_score: 88, rank_stage: 'final', title: 'Intern - AI Hardware and Memory Systems' });
  });
});

describe('run counters come from the database (chained CLI calls count too)', () => {
  it('dbCounters counts distinct jobs ranked, real status moves, drafts, contacts and manual jobs of one run', async () => {
    fx = makeFixture(); importLocal(fx.ctx);
    const { dbCounters } = await import('../../server/runs/runner');
    const { setRunTag } = await import('../../server/repo');
    setRunTag(42);
    try {
      // what `node dashboard/cli rank a && node dashboard/cli rank b && …` does in ONE tool call
      rankJob(fx.db, 'wd:micron:JR111017', 80, 'x', { stage: 'quick' });
      rankJob(fx.db, 'wd:nvidia:JR2026584', 70, 'x', { stage: 'quick' });
      rankJob(fx.db, 'wd:nvidia:JR2026584', 72, 'again', { stage: 'final' });
      setStatus(fx.db, 'simplify:abc-1', 'skip');
    } finally { setRunTag(null); }
    rankJob(fx.db, 'simplify:abc-1', 10, 'not in the run');
    expect(dbCounters(fx.db, 42)).toEqual({ ranked: 2, statuses: 1, outreach: 0, contacts: 0, jobsAdded: 0 });
    expect(dbCounters(fx.db, 43)).toEqual({ ranked: 0, statuses: 0, outreach: 0, contacts: 0, jobsAdded: 0 });
  });
});
