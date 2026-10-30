import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../server/app';
import { importLocal } from '../../server/sync';
import { setClock } from '../../server/repo';
import { inboxLine, makeFixture, type Fixture } from '../helpers';
import type { GitRunner } from '../../server/git';

let fx: Fixture;
let app: ReturnType<typeof createApp>['app'];

function setup(opts: Parameters<typeof makeFixture>[0] = {}) {
  fx = makeFixture(opts);
  importLocal(fx.ctx);
  app = createApp(fx.ctx, { exportDelayMs: 0 }).app;
  return fx;
}

const NVIDIA = 'wd:nvidia:JR2026584';
const MICRON = 'wd:micron:JR111017';
const ETCHED = 'simplify:abc-1';
const enc = encodeURIComponent;

beforeEach(() => setClock(() => new Date('2026-09-30T14:00:00Z')));
afterEach(() => { fx?.cleanup(); vi.unstubAllGlobals(); setClock(() => new Date()); });

describe('GET /api/jobs', () => {
  beforeEach(() => setup());

  it('lists all jobs sorted by fit/score, without descriptions', async () => {
    const r = await request(app).get('/api/jobs').expect(200);
    expect(r.body.map((j: { id: string }) => j.id)).toEqual([MICRON, NVIDIA, ETCHED]);
    expect(r.body[0]).not.toHaveProperty('description');
    expect(r.body[0]).toMatchObject({ has_description: false, company_priority: 'A' });
  });

  it('filters by status, priority, tag, company and text; sorts both ways; limits', async () => {
    await request(app).post(`/api/jobs/${enc(NVIDIA)}/status`).send({ status: 'skip' }).expect(200);
    expect((await request(app).get('/api/jobs?status=new,ranked')).body).toHaveLength(2);
    expect((await request(app).get('/api/jobs?status=skip')).body.map((j: { id: string }) => j.id)).toEqual([NVIDIA]);
    expect((await request(app).get('/api/jobs?priority=B')).body.map((j: { id: string }) => j.id)).toEqual([ETCHED]);
    expect((await request(app).get(`/api/jobs?tag=${enc('Memory/PIM')}`)).body.map((j: { id: string }) => j.id)).toEqual([MICRON]);
    expect((await request(app).get('/api/jobs?company=nvid')).body).toHaveLength(1);
    expect((await request(app).get('/api/jobs?q=rtl')).body.map((j: { id: string }) => j.id)).toEqual([ETCHED]);
    expect((await request(app).get('/api/jobs?sort=company&order=asc')).body.map((j: { company: string }) => j.company)).toEqual(['Etched', 'Micron', 'NVIDIA']);
    expect((await request(app).get('/api/jobs?sort=company&order=desc')).body.map((j: { company: string }) => j.company)).toEqual(['NVIDIA', 'Micron', 'Etched']);
    expect((await request(app).get('/api/jobs?sort=score&order=asc&limit=1')).body.map((j: { score: number }) => j.score)).toEqual([12]);
  });

  it('GET /api/jobs/:id returns the job with description, contacts and outreach', async () => {
    const c = (await request(app).post('/api/contacts').send({ name: 'Ana', company: 'NVIDIA Research', relationship: 'dac' }).expect(201)).body;
    await request(app).post('/api/outreach').send({ type: 'referral', contact_id: c.id, body: 'Hi Ana' }).expect(201);
    const r = await request(app).get(`/api/jobs/${enc(NVIDIA)}`).expect(200);
    expect(r.body.job).toMatchObject({ id: NVIDIA, description: '' });
    expect(r.body.contacts.map((x: { name: string }) => x.name)).toEqual(['Ana']);
    expect(r.body.outreach).toHaveLength(1);
    await request(app).get('/api/jobs/nope').expect(404);
  });
});

describe('decisions + undo', () => {
  beforeEach(() => setup());

  it('sets a decision, records decision_at, and undo restores it', async () => {
    const r = await request(app).post(`/api/jobs/${enc(MICRON)}/status`).send({ status: 'apply_referral' }).expect(200);
    expect(r.body.job).toMatchObject({ status: 'apply_referral', decision_at: '2026-09-30T14:00:00.000Z' });
    expect(r.body.eventId).toBeGreaterThan(0);
    const u = await request(app).post(`/api/events/${r.body.eventId}/undo`).expect(200);
    expect(u.body).toMatchObject({ status: 'new', decision_at: null });
    await request(app).post(`/api/events/${r.body.eventId}/undo`).expect(409);
  });

  it('rejects invalid transitions, unknown and removed statuses', async () => {
    expect((await request(app).post(`/api/jobs/${enc(MICRON)}/status`).send({ status: 'interview' }).expect(409)).body.error).toMatch(/from new to interview/);
    await request(app).post(`/api/jobs/${enc(MICRON)}/status`).send({ status: 'bogus' }).expect(400);
    expect((await request(app).post(`/api/jobs/${enc(MICRON)}/status`).send({ status: 'prepared' }).expect(400)).body.error).toMatch(/"prepared" was removed/);
    expect((await request(app).post(`/api/jobs/${enc(MICRON)}/status`).send({ status: 'rejected' }).expect(400)).body.error).toMatch(/stays "applied"/);
  });

  it('"Apply direct" = applied at once (apply_direct is still accepted as its alias), with undo', async () => {
    const r = await request(app).post(`/api/jobs/${enc(MICRON)}/status`).send({ status: 'applied' }).expect(200);
    expect(r.body.job).toMatchObject({ status: 'applied', applied_date: '2026-09-30', decision_at: '2026-09-30T14:00:00.000Z' });
    await request(app).post(`/api/events/${r.body.eventId}/undo`).expect(200);
    const alias = await request(app).post(`/api/jobs/${enc(MICRON)}/status`).send({ status: 'apply_direct' }).expect(200);
    expect(alias.body.job.status).toBe('applied');
  });

  it('Referral → Applied → Interview → Back to applied (interview keeps the decision date)', async () => {
    await request(app).post(`/api/jobs/${enc(MICRON)}/status`).send({ status: 'apply_referral' }).expect(200);
    await request(app).post(`/api/jobs/${enc(MICRON)}/status`).send({ status: 'applied' }).expect(200);
    const i = (await request(app).post(`/api/jobs/${enc(MICRON)}/status`).send({ status: 'interview' }).expect(200)).body.job;
    expect(i).toMatchObject({ status: 'interview', outcome_date: '2026-09-30' });
    setClock(() => new Date('2026-10-05T14:00:00Z'));
    const back = (await request(app).post(`/api/jobs/${enc(MICRON)}/status`).send({ status: 'applied' }).expect(200)).body.job;
    expect(back).toMatchObject({ status: 'applied', applied_date: '2026-09-30', decision_at: '2026-09-30T14:00:00.000Z' });
    await request(app).post(`/api/jobs/${enc(MICRON)}/status`).send({ status: 'skip' }).expect(409);
  });

  it('only the latest change can be undone', async () => {
    const a = (await request(app).post(`/api/jobs/${enc(MICRON)}/status`).send({ status: 'later' })).body.eventId;
    await request(app).post(`/api/jobs/${enc(MICRON)}/status`).send({ status: 'skip' });
    await request(app).post(`/api/events/${a}/undo`).expect(409);
  });

  it('applied sets applied_date; outcomes set outcome_date; notes are appended', async () => {
    await request(app).post(`/api/jobs/${enc(MICRON)}/status`).send({ status: 'applied', note: 'Submitted on Workday' });
    const r = await request(app).post(`/api/jobs/${enc(MICRON)}/status`).send({ status: 'interview' }).expect(200);
    expect(r.body.job).toMatchObject({ applied_date: expect.stringMatching(/^2026-09-3\d|^2026-09-30/), outcome_date: expect.any(String) });
    expect(r.body.job.notes).toMatch(/Submitted on Workday/);
  });

  it('bulk Skip / Later with undo for all', async () => {
    const r = await request(app).post('/api/jobs/bulk-status').send({ ids: [MICRON, NVIDIA], status: 'skip' }).expect(200);
    expect(r.body.updated).toHaveLength(2);
    expect(r.body.eventIds).toHaveLength(2);
    for (const id of r.body.eventIds) await request(app).post(`/api/events/${id}/undo`).expect(200);
    expect((await request(app).get('/api/jobs?status=new')).body).toHaveLength(3);
    await request(app).post('/api/jobs/bulk-status').send({ ids: [], status: 'skip' }).expect(400);
  });

  it('regenerates tracker.csv after a change', async () => {
    await request(app).post(`/api/jobs/${enc(MICRON)}/status`).send({ status: 'skip' });
    const csv = fs.readFileSync(path.join(fx.root, 'jobs/tracker.csv'), 'utf8');
    expect(csv.split('\n').find((l) => l.startsWith(MICRON))).toContain(',skip,');
  });
});

describe('notes autosave, request referral', () => {
  beforeEach(() => setup());

  it('PATCH saves notes and application_dir; rejects unknown fields', async () => {
    const r = await request(app).patch(`/api/jobs/${enc(NVIDIA)}`).send({ notes: 'Ask Ana' }).expect(200);
    expect(r.body.notes).toBe('Ask Ana');
    await request(app).patch(`/api/jobs/${enc(NVIDIA)}`).send({ status: 'offer' }).expect(400);
  });

  it('request-referral sets the flag Claude picks up', async () => {
    const r = await request(app).post(`/api/jobs/${enc(NVIDIA)}/request-referral`).send({}).expect(200);
    expect(r.body.referral_requested_at).toBe('2026-09-30T14:00:00.000Z');
    const facts = (await request(app).get('/api/claude-facts')).body;
    expect(facts.referralRequested.map((j: { id: string }) => j.id)).toEqual([NVIDIA]);
  });
});

describe('POST /api/jobs/:id/fetch-description (mocked HTTP)', () => {
  beforeEach(() => setup());

  it('uses the Workday API for Workday jobs and re-derives tags', async () => {
    const fetchMock = vi.fn(async (_url: string) => new Response(JSON.stringify({ jobPostingInfo: { jobDescription: '<p>Design <b>HBM</b> memory systems with ECC for AI accelerators. PhD students preferred.</p>' } }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const r = await request(app).post(`/api/jobs/${enc(MICRON)}/fetch-description`).expect(200);
    expect(fetchMock.mock.calls[0][0]).toBe('https://micron.wd1.myworkdayjobs.com/wday/cxs/micron/External/job/Folsom-CA/Intern---AI-Hardware_JR111017');
    expect(r.body.description).toContain('<b>HBM</b>');
    expect(r.body.tags).toEqual(expect.arrayContaining(['Memory/PIM', 'Reliability/ECC']));
    expect(r.body.description_fetched_at).toBe('2026-09-30T14:00:00.000Z');
  });

  it('uses the Ashby board for an Ashby URL', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ jobs: [{ id: '11111111-2222-3333-4444-555555555555', descriptionHtml: '<p>Write RTL for our transformer ASIC. Verilog, UVM.</p>' }] }))));
    const r = await request(app).post(`/api/jobs/${enc(ETCHED)}/fetch-description`).expect(200);
    expect(r.body.tags).toEqual(expect.arrayContaining(['ASIC/RTL', 'Verification']));
  });

  it('returns 502 with a readable message when the site fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })));
    const r = await request(app).post(`/api/jobs/${enc(NVIDIA)}/fetch-description`).expect(502);
    expect(r.body.error).toMatch(/Couldn't fetch the description: HTTP 500/);
  });
});

describe('contacts + outreach', () => {
  beforeEach(() => setup());

  async function contact(extra: Record<string, unknown> = {}) {
    return (await request(app).post('/api/contacts').send({ name: 'Dr. Lee', company: 'Micron', relationship: 'researcher', email: 'lee@micron.com', email_source: 'ISCA 2026 paper PDF', email_confidence: 'from_paper', papers: [{ title: 'PIM paper', venue: 'ISCA', year: 2026 }], ...extra }).expect(201)).body;
  }

  it('contact CRUD with validation', async () => {
    const c = await contact();
    expect(c.papers).toEqual([{ title: 'PIM paper', venue: 'ISCA', year: 2026 }]);
    expect((await request(app).get('/api/contacts?company=Micron')).body).toHaveLength(1);
    expect((await request(app).patch(`/api/contacts/${c.id}`).send({ work_summary: 'Works on HBM-PIM' })).body.work_summary).toBe('Works on HBM-PIM');
    expect((await request(app).get(`/api/contacts/${c.id}`)).body.contact.name).toBe('Dr. Lee');
    await request(app).post('/api/contacts').send({ name: 'X', email: 'x@y.com' }).expect(400); // no confidence
    await request(app).post('/api/contacts').send({ name: 'X', relationship: 'boss' }).expect(400);
    await request(app).post('/api/contacts').send({ company: 'X' }).expect(400);
  });

  it('outreach create, edit, list by type/status', async () => {
    const c = await contact();
    const o = (await request(app).post('/api/outreach').send({ type: 'cold_email', contact_id: c.id, job_id: MICRON, subject: 'PIM + ECC', body: 'Dear Dr. Lee' }).expect(201)).body;
    expect(o).toMatchObject({ channel: 'email', status: 'draft', contact_name: 'Dr. Lee', job_title: 'Intern - AI Hardware and Memory Systems' });
    const e = (await request(app).patch(`/api/outreach/${o.id}`).send({ body: 'Dear Dr. Lee, edited', status: 'ready' }).expect(200)).body;
    expect(e).toMatchObject({ body: 'Dear Dr. Lee, edited', status: 'ready' });
    expect((await request(app).get('/api/outreach?type=cold_email&status=ready')).body).toHaveLength(1);
    expect((await request(app).get('/api/outreach?type=referral')).body).toHaveLength(0);
    await request(app).post('/api/outreach').send({ type: 'spam', contact_id: c.id, body: 'x' }).expect(400);
    await request(app).post('/api/outreach').send({ type: 'cold_email', body: 'x' }).expect(400);
    await request(app).patch(`/api/outreach/${o.id}`).send({ status: 'bogus' }).expect(400);
    await request(app).get('/api/outreach/999').expect(404);
  });

  it('mark sent sets sent_at and follow_up_due (+7 referral, +10 cold email); due list; follow-up clears it', async () => {
    const c = await contact();
    const cold = (await request(app).post('/api/outreach').send({ type: 'cold_email', contact_id: c.id, body: 'Dear' })).body;
    const ref = (await request(app).post('/api/outreach').send({ type: 'referral', contact_id: c.id, body: 'Hey' })).body;
    const s1 = (await request(app).post(`/api/outreach/${cold.id}/sent`).expect(200)).body;
    const s2 = (await request(app).post(`/api/outreach/${ref.id}/sent`).expect(200)).body;
    expect(s1).toMatchObject({ status: 'sent', sent_at: '2026-09-30T14:00:00.000Z', follow_up_due: '2026-10-10' });
    expect(s2.follow_up_due).toBe('2026-10-07');
    await request(app).post(`/api/outreach/${cold.id}/sent`).expect(409);
    expect((await request(app).get('/api/outreach?due=1')).body).toHaveLength(0);

    setClock(() => new Date('2026-10-08T14:00:00Z'));
    const due = (await request(app).get('/api/outreach?due=1')).body;
    expect(due.map((o: { id: number }) => o.id)).toEqual([ref.id]);
    // Claude drafts the follow-up → no longer "due"
    await request(app).post('/api/outreach').send({ type: 'follow_up', parent_id: ref.id, body: 'Just following up' }).expect(201);
    expect((await request(app).get('/api/outreach?due=1')).body).toHaveLength(0);
  });

  it('replies: referred / declined / no_reply; a follow-up reply closes the parent', async () => {
    const c = await contact();
    const ref = (await request(app).post('/api/outreach').send({ type: 'referral', contact_id: c.id, body: 'Hey' })).body;
    await request(app).post(`/api/outreach/${ref.id}/reply`).send({ outcome: 'referred' }).expect(409); // not sent yet
    await request(app).post(`/api/outreach/${ref.id}/sent`);
    const f = (await request(app).post('/api/outreach').send({ type: 'follow_up', parent_id: ref.id, body: 'ping' })).body;
    expect(f).toMatchObject({ contact_id: c.id, channel: 'linkedin' });
    await request(app).post(`/api/outreach/${f.id}/sent`);
    const r = (await request(app).post(`/api/outreach/${f.id}/reply`).send({ outcome: 'referred', notes: 'Submitted referral' }).expect(200)).body;
    expect(r).toMatchObject({ status: 'referred', reply_notes: 'Submitted referral' });
    expect((await request(app).get(`/api/outreach/${ref.id}`)).body.status).toBe('referred');
    await request(app).post(`/api/outreach/${ref.id}/reply`).send({ outcome: 'maybe' }).expect(400);
  });
});

describe('meta, stats, companies, facts, marks', () => {
  beforeEach(() => setup());

  it('GET /api/meta has watcher health from the newest digest, and config', async () => {
    const r = (await request(app).get('/api/meta').expect(200)).body;
    expect(r.health).toMatchObject({ lastRunAt: '2026-09-29T22:09:00.000Z', source: 'digest', errors: expect.arrayContaining(['SimplifyJobs: fetch failed']) });
    expect(r.config.outlookComposeUrl).toBe('https://outlook.office.com/mail/deeplink/compose');
    expect(r.config.resumePath).toMatch(/Resume/);
  });

  it('watcher health prefers last_run.json', async () => {
    fs.mkdirSync(path.join(fx.root, 'watcher/state'), { recursive: true });
    fs.writeFileSync(path.join(fx.root, 'watcher/state/last_run.json'), JSON.stringify({ at: '2026-09-30T12:00:00Z', matches: 0, errors: [] }));
    expect((await request(app).get('/api/meta')).body.health).toMatchObject({ source: 'last_run', errors: [], matches: 0 });
  });

  it('stats: KPIs per phase and the last manual job search (runs, manual checks)', async () => {
    await request(app).post(`/api/jobs/${enc(MICRON)}/status`).send({ status: 'apply_referral' });
    await request(app).post(`/api/jobs/${enc(NVIDIA)}/status`).send({ status: 'applied' });
    let s = (await request(app).get('/api/stats').expect(200)).body;
    expect(s.kpis).toEqual({ new: 1, awaiting: 1, referral: 1, applied: 1, interviews: 0 });
    expect(s.lastJobSearch).toBeNull();
    fx.db.prepare("INSERT INTO runs(task, status, created_at, finished_at) VALUES ('process-new-jobs', 'succeeded', '2026-09-28T10:00:00Z', '2026-09-28T10:20:00Z')").run();
    fx.db.prepare("INSERT INTO runs(task, status, created_at, finished_at) VALUES ('process-new-jobs', 'failed', '2026-09-29T10:00:00Z', '2026-09-29T10:01:00Z')").run();
    s = (await request(app).get('/api/stats')).body;
    expect(s.lastJobSearch).toEqual({ at: '2026-09-28T10:20:00Z', what: 'Process new jobs' });
    fx.db.prepare("INSERT INTO manual_checks(company, checked_at, result) VALUES ('Meta', '2026-09-29T08:00:00.000Z', 'ok')").run();
    expect((await request(app).get('/api/stats')).body.lastJobSearch).toEqual({ at: '2026-09-29T08:00:00.000Z', what: 'Manual check: Meta' });
  });

  it('company notes: one per company (any spelling of the name), editable, cleared with an empty note', async () => {
    expect((await request(app).get('/api/company-notes').expect(200)).body).toEqual([]);
    const n = (await request(app).post('/api/company-notes').send({ company: 'NVIDIA', note: 'Asked Ana on LinkedIn' }).expect(200)).body;
    expect(n).toMatchObject({ company_key: 'nvidia', company: 'NVIDIA', note: 'Asked Ana on LinkedIn' });
    await request(app).post('/api/company-notes').send({ company: 'NVIDIA Corporation (Research)', note: 'Ana referred me' }).expect(200);
    expect((await request(app).get('/api/company-notes')).body.map((x: { note: string }) => x.note)).toEqual(['Ana referred me']);
    await request(app).post('/api/company-notes').send({ company: '', note: 'x' }).expect(400);
    await request(app).post('/api/company-notes').send({ company: 'NVIDIA', note: 5 }).expect(400);
    await request(app).post('/api/company-notes').send({ company: 'NVIDIA', note: '' }).expect(200);
    expect((await request(app).get('/api/company-notes')).body).toEqual([]);
  });

  it('companies mirror companies.csv with counts and the manual flag', async () => {
    const r = (await request(app).get('/api/companies').expect(200)).body;
    expect(r).toHaveLength(6);
    expect(r.find((c: { name: string }) => c.name === 'NVIDIA')).toMatchObject({ open_jobs: 1, contacts: 0, manual: false, priority: 'A' });
    expect(r.find((c: { name: string }) => c.name === 'Meta')).toMatchObject({ manual: true });
  });

  it('claude-facts: new jobs, to prepare, referral without contact, researchers, watcher errors, marks', async () => {
    await request(app).post(`/api/jobs/${enc(MICRON)}/status`).send({ status: 'apply_referral' });
    let f = (await request(app).get('/api/claude-facts').expect(200)).body;
    expect(f).toMatchObject({ newCount: 2, researcherCount: 0, followUpsDue: 0, lastWeeklyReview: null, today: '2026-09-30' });
    expect(f.toPrepare.map((j: { id: string }) => j.id)).toEqual([MICRON]);
    expect(f.referralNoContact).toEqual(['Micron']);
    expect(f.watcherErrors).toHaveLength(2);
    expect(f.manualCompanies).toEqual(['Meta', 'Tesla (AI hardware)']);
    await request(app).post('/api/contacts').send({ name: 'Friend', company: 'Micron', relationship: 'friend' });
    await request(app).post('/api/marks').send({ kind: 'weekly_review' }).expect(200);
    await request(app).post('/api/marks').send({ kind: 'watcher_errors_fixed' }).expect(200);
    await request(app).post('/api/marks').send({ kind: 'nope' }).expect(400);
    f = (await request(app).get('/api/claude-facts')).body;
    expect(f.referralNoContact).toEqual([]);
    expect(f.lastWeeklyReview).toBe('2026-09-30T14:00:00.000Z');
    expect(f.watcherErrors).toEqual([]);
  });

  it('unknown API routes are JSON 404s; non-JSON writes are refused; foreign Host is refused', async () => {
    expect((await request(app).get('/api/nope').expect(404)).body.error).toMatch(/No such API route/);
    await request(app).post(`/api/jobs/${enc(MICRON)}/status`).set('Content-Type', 'text/plain').send('status=skip').expect(415);
    await request(app).get('/api/jobs').set('Host', 'evil.example').expect(403);
  });
});

describe('POST /api/sync (mocked git)', () => {
  it('success: pulls, imports new inbox files, reports counts', async () => {
    setup();
    fs.writeFileSync(path.join(fx.root, 'jobs/inbox/2026-09-30_1200.jsonl'), inboxLine({ id: 'new:1' }) + '\n' + inboxLine({ id: 'new:2', title: 'Second' }) + '\n');
    const r = (await request(app).post('/api/sync').expect(200)).body;
    expect(fx.gitCalls.slice(1)[0]).toEqual(['fetch']);
    expect(fx.gitCalls.some((c) => c[0] === 'stash' || c.includes('--autostash'))).toBe(false); // never stashes local edits
    expect(r).toMatchObject({ pulled: true, warning: null, importedJobs: 2, importedFiles: ['jobs/inbox/2026-09-30_1200.jsonl'] });
    expect((await request(app).post('/api/sync')).body.importedJobs).toBe(0);
    expect((await request(app).get('/api/meta')).body.lastSync).toMatchObject({ pulled: true });
    expect(fs.readdirSync(path.join(fx.root, 'data/backups')).length).toBe(1);
  });

  it('failure: returns a warning with git\'s message, keeps working, and imports upstream-only inbox files', async () => {
    const upstreamFile = 'jobs/inbox/2026-09-30_2300.jsonl';
    const git: GitRunner = async (args) => {
      if (args[0] === 'fetch') return { code: 128, stdout: '', stderr: 'fatal: unable to access github.com: Could not resolve host\n' };
      if (args[0] === 'ls-tree') return { code: 0, stdout: `jobs/inbox/README.md\n${upstreamFile}\n`, stderr: '' };
      if (args[0] === 'show') return { code: 0, stdout: inboxLine({ id: 'up:1', title: 'Upstream job' }) + '\n', stderr: '' };
      return { code: 1, stdout: '', stderr: '' };
    };
    setup({ git });
    const r = (await request(app).post('/api/sync').expect(200)).body;
    expect(r.pulled).toBe(false);
    expect(r.warning).toMatch(/git fetch failed.*Could not resolve host/);
    expect(r.warning).toMatch(/Imported 1 new watcher file/);
    expect(r.importedFiles).toEqual([upstreamFile]);
    expect((await request(app).get(`/api/jobs/${enc('up:1')}`)).body.job.title).toBe('Upstream job');
    // fetch fails → upstream inbox via ls-tree/show → commit step finds no git status
    expect(fx.gitCalls.slice(1).map((c) => c[0])).toEqual(['fetch', 'ls-tree', 'show', 'status']);
    expect(fx.gitCalls.some((c) => c[0] === 'push')).toBe(false);
  });

  it('a git that throws is also just a warning', async () => {
    setup({ git: async () => { throw new Error('spawn git ENOENT'); } });
    const r = (await request(app).post('/api/sync').expect(200)).body;
    expect(r.warning).toMatch(/ENOENT/);
  });
});
