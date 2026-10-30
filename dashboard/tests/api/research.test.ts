// Researcher finding v2 (plan §6): candidates from recorded OpenAlex/Semantic Scholar responses (offline cache),
// LinkedIn fields and the owner's confirm/reject, and a cold-emails run with the fake claude.
import path from 'node:path';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../server/app';
import { importLocal } from '../../server/sync';
import { addContact, getContact, setRunTag, updateContact } from '../../server/repo';
import { findCandidates, listCandidates, researchHttp } from '../../server/research/candidates';
import { ResearchHttp } from '../../server/research/http';
import { worksUrl } from '../../server/research/openalex';
import { emailMatchesName, paperEmailSearchDone } from '../../server/research/paperEmails';
import { RunManager } from '../../server/runs/runner';
import { buildPrompt } from '../../server/runs/prompts';
import { TASKS } from '../../server/runs/tasks';
import { fakeCalls, fakeScenario, makeFixture, type Fixture } from '../helpers';
import { ETCHED_PDF, NVIDIA_US, primeResearchCache, SINCE, writeTestMap } from '../fixtures/research';

let fx: Fixture;
let runs: RunManager | undefined;
afterEach(() => { runs?.shutdown(); runs = undefined; setRunTag(null); fx?.cleanup(); });

/** An app whose run manager is shut down after the test (and exports synchronously, so no timer outlives the database). */
function appFor(o: Parameters<typeof createApp>[1] = {}) {
  const created = createApp(fx.ctx, { exportDelayMs: 0, runOptions: { pipelines: {} }, ...o });
  runs = created.runs;
  return created;
}

function setup(o: { prime?: boolean } = {}) {
  fx = makeFixture();
  writeTestMap(fx.root);
  importLocal(fx.ctx);
  if (o.prime !== false) primeResearchCache(fx.cfg.dataDir);
  return fx;
}

describe('research candidates', () => {
  it('finds researchers at the target companies from recorded papers, best first, stored once', async () => {
    setup();
    const r = await findCandidates(fx.ctx, { since: SINCE });
    // Priority A,B companies of the test CSV: NVIDIA (map ids), Micron + Meta (not in the test map), Etched (affiliation text).
    expect(r.companies).toEqual(['NVIDIA', 'Etched']);
    expect(r.notInMap).toEqual(['Micron', 'Meta']);
    expect(r.warnings[0]).toMatch(/Not in targets\/openalex_institutions.json .*Micron, Meta/);
    expect(r.requests).toBe(0);
    expect(r.fromCache).toBeGreaterThanOrEqual(2);
    const names = r.candidates.map((c) => c.name);
    expect(names).toEqual(expect.arrayContaining(['Pat Example', 'Robin Sample', 'Haoxing Mark Ren', 'Aamer Jaleel']));
    expect(names).not.toContain('Uni Person'); // a co-author at a university, not at the company
    expect(r.candidates.map((c) => c.score)).toEqual([...r.candidates.map((c) => c.score)].sort((a, b) => b - a));
    const pat = r.candidates.find((c) => c.name === 'Pat Example')!;
    expect(pat).toMatchObject({ company: 'Etched', us: true, openalex_id: 'A9000000001', status: 'new', contact_id: null });
    // Semantic Scholar filled in the PDF link OpenAlex didn't have.
    expect(pat.papers[0]).toMatchObject({ venue: 'ISCA', year: 2025, position: 'first', pdf_url: ETCHED_PDF });
    const ren = r.candidates.find((c) => c.name === 'Haoxing Mark Ren')!;
    expect(ren.papers[0]).toMatchObject({ venue: 'DAC', position: 'last' });
    // Idempotent: a second search updates the same rows.
    const n = listCandidates(fx.db).length;
    await findCandidates(fx.ctx, { since: SINCE });
    expect(listCandidates(fx.db)).toHaveLength(n);
  });

  it('keeps the owner\'s choices on a new search; contacts are marked (OpenAlex id or name + company)', async () => {
    setup();
    await findCandidates(fx.ctx, { since: SINCE });
    const all = listCandidates(fx.db);
    const pat = all.find((c) => c.name === 'Pat Example')!;
    const robin = all.find((c) => c.name === 'Robin Sample')!;
    const ren = all.find((c) => c.name === 'Haoxing Mark Ren')!;
    await request(appFor().app).post('/api/research/candidates/status').send({ ids: [ren.id], status: 'skipped' }).expect(200);
    addContact(fx.db, { name: 'Pat Example', company: 'Etched', relationship: 'researcher', openalex_id: 'https://openalex.org/A9000000001' });
    addContact(fx.db, { name: 'robin  sample', company: 'etched', relationship: 'researcher' });
    const again = await findCandidates(fx.ctx, { since: SINCE });
    expect(again.candidates.map((c) => c.name)).not.toEqual(expect.arrayContaining(['Pat Example']));
    expect(again.candidates.map((c) => c.name)).not.toContain('Haoxing Mark Ren');
    const after = listCandidates(fx.db);
    expect(after.find((c) => c.id === pat.id)).toMatchObject({ status: 'contacted' });
    expect(after.find((c) => c.id === robin.id)).toMatchObject({ status: 'contacted' });
    expect(after.find((c) => c.id === ren.id)).toMatchObject({ status: 'skipped' });
    const everyone = await findCandidates(fx.ctx, { since: SINCE, all: true });
    expect(everyone.candidates.find((c) => c.name === 'Pat Example')?.contact_id).toBeGreaterThan(0);
    // --ids: just the picked ones, no search.
    const picked = await findCandidates(fx.ctx, { ids: [ren.id, 9999] });
    expect(picked.candidates.map((c) => c.id)).toEqual([ren.id]);
    expect(picked.warnings).toEqual(['No research candidate(s) 9999']);
  });

  it('only the named companies / venues; an unknown venue is a 400', async () => {
    setup();
    const r = await findCandidates(fx.ctx, { companies: ['etched'], since: SINCE });
    expect(r.companies).toEqual(['Etched']);
    expect(new Set(r.candidates.map((c) => c.company))).toEqual(new Set(['Etched']));
    const none = await findCandidates(fx.ctx, { companies: ['NVIDIA'], venues: ['ISSCC'], since: SINCE });
    expect(none.candidates.filter((c) => c.papers.some((p) => p.venue === 'DAC'))).toEqual([]);
    await expect(findCandidates(fx.ctx, { venues: ['NeurIPS'] })).rejects.toMatchObject({ status: 400 });
  });

  it('OpenAlex budget used up: a warning, searching stops, stored candidates are still listed', async () => {
    setup();
    await findCandidates(fx.ctx, { since: SINCE, companies: ['Etched'] });
    const http = new ResearchHttp({
      cacheDir: path.join(fx.cfg.dataDir, 'other-cache'), intervalMs: {},
      fetchImpl: (async () => new Response('{"message":"Insufficient budget"}', { status: 429, headers: { 'retry-after': '3600' } })) as typeof fetch,
    });
    const r = await findCandidates(fx.ctx, { since: SINCE }, http);
    expect(r.warnings.join('\n')).toMatch(/NVIDIA: .*daily request budget is used up/);
    expect(r.warnings.join('\n')).toMatch(/Stopped searching/);
    expect(r.requests).toBe(1); // stopped after the first refusal
    expect(r.candidates.map((c) => c.name)).toEqual(expect.arrayContaining(['Pat Example']));
  });

  it('offline cache miss is reported per company, never a crash', async () => {
    setup({ prime: false });
    const r = await findCandidates(fx.ctx, { since: SINCE });
    expect(r.warnings.join('\n')).toMatch(/NVIDIA: offline: no cached response/);
    expect(r.candidates).toEqual([]);
  });

  it('pages through OpenAlex with the cursor, at most maxPages', async () => {
    setup({ prime: false });
    const http = researchHttp(fx.cfg);
    const page = (n: number, cursor: string | null) => JSON.stringify({ meta: { next_cursor: cursor }, results: Array.from({ length: n }, (_, i) => ({ id: `W${cursor}${i}`, title: `p${i}`, authorships: [] })) });
    const w = new ResearchHttp({ cacheDir: path.join(fx.cfg.dataDir, 'research-cache') });
    w.put(worksUrl({ ids: [NVIDIA_US] }, SINCE, '*'), 200, 'application/json', page(200, 'c2'));
    w.put(worksUrl({ ids: [NVIDIA_US] }, SINCE, 'c2'), 200, 'application/json', page(200, 'c3'));
    const r = await findCandidates(fx.ctx, { since: SINCE, companies: ['NVIDIA'], maxPages: 2 }, http);
    expect(r.fromCache).toBe(2);
    expect(r.warnings).toEqual([]);
  });

  it('page 2 answering 401 (OpenAlex: "API key required for cursor paging") keeps page 1, no warning', async () => {
    setup({ prime: false });
    const page = (n: number, cursor: string | null) => JSON.stringify({ meta: { next_cursor: cursor }, results: Array.from({ length: n }, (_, i) => ({ id: `W${cursor}${i}`, title: `p${i}`, authorships: [] })) });
    const http = new ResearchHttp({
      cacheDir: path.join(fx.cfg.dataDir, 'research-cache-401'), backoffMs: 1,
      fetchImpl: (async (u: string) => (String(u).includes('cursor=*')
        ? new Response(page(200, 'c2'), { status: 200, headers: { 'content-type': 'application/json' } })
        : new Response('{"error":"API key required for cursor paging"}', { status: 401 }))) as unknown as typeof fetch,
    });
    const r = await findCandidates(fx.ctx, { since: SINCE, companies: ['NVIDIA'], maxPages: 3, enrich: false }, http);
    expect(r.warnings).toEqual([]);
    expect(r.requests).toBe(2);
  });
});

describe('contacts: LinkedIn fields', () => {
  it('validates and normalizes links and OpenAlex ids; a run\'s link is Unverified; duplicates refused', () => {
    setup();
    expect(() => addContact(fx.db, { name: 'A', company: 'NVIDIA', linkedin_url: 'https://www.linkedin.com/company/nvidia' })).toThrow(/not a LinkedIn profile link/);
    expect(() => addContact(fx.db, { name: 'A', company: 'NVIDIA', openalex_id: 'W1' })).toThrow(/OpenAlex author id/);
    expect(() => addContact(fx.db, { name: 'A', company: 'NVIDIA', linkedin_confidence: 'maybe' })).toThrow(/linkedin confidence/);
    // The owner's own entry: no confidence (he knows the person).
    const friend = addContact(fx.db, { name: 'Friend One', company: 'NVIDIA', relationship: 'friend', linkedin_url: 'linkedin.com/in/friend-one/' });
    expect(friend).toMatchObject({ linkedin_url: 'https://www.linkedin.com/in/friend-one', linkedin_confidence: null });
    setRunTag(7);
    const c = addContact(fx.db, { name: 'Jane Doe', company: 'NVIDIA', linkedin_url: 'https://www.linkedin.com/in/jane-doe', linkedin_source: 'web search: "Jane Doe" NVIDIA LinkedIn', openalex_id: 'A5000000001' });
    expect(c).toMatchObject({ linkedin_confidence: 'search_match', linkedin_source: 'web search: "Jane Doe" NVIDIA LinkedIn', openalex_id: 'A5000000001' });
    expect(() => addContact(fx.db, { name: 'J. Doe', company: 'NVIDIA', openalex_id: 'A5000000001' })).toThrow(/Already a contact: #\d+ Jane Doe/);
    expect(() => addContact(fx.db, { name: 'jane doe', company: 'nvidia' })).toThrow(/Already a contact/);
  });

  it('confirm → Confirmed; reject → link cleared and never accepted again', async () => {
    setup();
    const { app } = appFor();
    setRunTag(3);
    const c = addContact(fx.db, { name: 'Jane Doe', company: 'NVIDIA', linkedin_url: 'https://www.linkedin.com/in/jane-doe' });
    const b = addContact(fx.db, { name: 'Bob Roe', company: 'NVIDIA', linkedin_url: 'https://www.linkedin.com/in/bob-roe' });
    setRunTag(null);
    expect((await request(app).post(`/api/contacts/${c.id}/linkedin`).send({ decision: 'confirm' }).expect(200)).body).toMatchObject({ linkedin_confidence: 'confirmed', linkedin_url: 'https://www.linkedin.com/in/jane-doe' });
    const rej = (await request(app).post(`/api/contacts/${b.id}/linkedin`).send({ decision: 'reject' }).expect(200)).body;
    expect(rej).toMatchObject({ linkedin_confidence: 'rejected', linkedin_url: null, linkedin_rejected: 'https://www.linkedin.com/in/bob-roe' });
    await request(app).post(`/api/contacts/${b.id}/linkedin`).send({ decision: 'confirm' }).expect(409);
    await request(app).post(`/api/contacts/${c.id}/linkedin`).send({ decision: 'maybe' }).expect(400);
    // Claude suggesting the rejected link again is refused; a different link starts as Unverified again.
    setRunTag(4);
    expect(() => updateContact(fx.db, b.id, { linkedin_url: 'https://linkedin.com/in/bob-roe/' })).toThrow(/wrong person/);
    expect(updateContact(fx.db, b.id, { linkedin_url: 'https://www.linkedin.com/in/bob-roe-2' })).toMatchObject({ linkedin_confidence: 'search_match' });
    setRunTag(null);
    const kinds = (fx.db.prepare("SELECT kind FROM events WHERE entity='contact' ORDER BY id").all() as { kind: string }[]).map((e) => e.kind);
    expect(kinds).toEqual(expect.arrayContaining(['linkedin_confirmed', 'linkedin_rejected', 'linkedin_set']));
    // Outreach rows carry the contact's LinkedIn state for the Referrals tab.
    await request(app).post('/api/outreach').send({ type: 'referral', contact_id: c.id, body: 'Hi' }).expect(201);
    const list = (await request(app).get('/api/outreach').expect(200)).body;
    expect(list[0]).toMatchObject({ contact_linkedin_confidence: 'confirmed' });
    expect(getContact(fx.db, c.id).linkedin_confidence).toBe('confirmed');
  });
});

describe('research API', () => {
  it('lists candidates with counts, sets status, searches without Claude', async () => {
    setup();
    const { app } = appFor({ researchHttp: () => researchHttp(fx.cfg) });
    const empty = (await request(app).get('/api/research/candidates').expect(200)).body;
    expect(empty.candidates).toEqual([]);
    const s = (await request(app).post('/api/research/search').send({}).expect(200)).body;
    expect(s).toMatchObject({ companies: ['NVIDIA', 'Etched'], listed: expect.any(Number) });
    expect(s.listed).toBeGreaterThan(3);
    const l = (await request(app).get('/api/research/candidates?status=new').expect(200)).body;
    expect(l.counts.new).toBe(l.candidates.length);
    const id = l.candidates[0].id;
    await request(app).post('/api/research/candidates/status').send({ ids: [id], status: 'contacted' }).expect(400);
    await request(app).post('/api/research/candidates/status').send({ ids: [424242], status: 'skipped' }).expect(404);
    await request(app).post('/api/research/candidates/status').send({ ids: [id], status: 'picked' }).expect(200);
    expect((await request(app).get('/api/research/candidates').expect(200)).body.counts.picked).toBe(1);
  });
});

describe('cold-emails run (fake claude)', () => {
  it('adds researchers with paper e-mails and Unverified LinkedIn links, drafts linked to the job', async () => {
    setup();
    fakeScenario(fx.cfg.dataDir, 'success');
    const created = appFor();
    const job = 'simplify:abc-1'; // the Etched job in the test tracker
    const r = await request(created.app).post('/api/runs').send({ task: 'cold-emails-company', params: { company: 'Etched', jobId: job } }).expect(201);
    await created.runs.whenIdle();
    const run = (await request(created.app).get(`/api/runs/${r.body.run.id}`).expect(200)).body;
    expect(run.status).toBe('succeeded');
    expect(run.progress.counters).toMatchObject({ contacts: 2, outreach: 2 });
    expect(run.progress.steps.map((s: { text: string }) => s.text)).toEqual(expect.arrayContaining(['Searching papers (OpenAlex)', 'Reading a paper PDF for e-mails']));
    const contacts = fx.db.prepare("SELECT * FROM contacts WHERE company='Etched' ORDER BY name").all() as Record<string, unknown>[];
    expect(contacts.map((c) => [c.name, c.email, c.email_confidence, c.linkedin_confidence, c.openalex_id])).toEqual([
      ['Pat Example', 'pat@etched.example', 'from_paper', 'search_match', 'A9000000001'],
      ['Robin Sample', 'robin@etched.example', 'from_paper', 'search_match', 'A9000000003'],
    ]);
    expect(String(contacts[0].email_source)).toBe('ISCA 2025 paper PDF');
    const drafts = fx.db.prepare("SELECT * FROM outreach WHERE type='cold_email'").all() as Record<string, unknown>[];
    expect(drafts.every((d) => d.job_id === job && d.status === 'draft')).toBe(true);
    expect(listCandidates(fx.db, { companies: ['Etched'] }).map((c) => c.status)).toEqual(['contacted', 'contacted']);
    // The run could not fetch LinkedIn pages (denied for every run).
    const argv = fakeCalls(fx.cfg.dataDir)[0].argv;
    expect(argv.slice(argv.indexOf('--disallowedTools'))).toEqual(expect.arrayContaining(['WebFetch(domain:linkedin.com)']));
    expect(buildPrompt(TASKS['cold-emails-company'], { runId: 1, params: { company: 'Etched' } })).toMatch(/research candidates --companies "Etched"/);
  });
});

describe('"Find R&D emails from papers" (Referral phase, no Claude)', () => {
  it('POST starts it in the background (202, running); GET polls until done; results are cached per company', async () => {
    setup();
    const { app } = appFor({ researchHttp: () => primeResearchCache(fx.cfg.dataDir) });
    expect((await request(app).get('/api/research/paper-emails?company=Etched').expect(200)).body).toBeNull();
    const started = (await request(app).post('/api/research/paper-emails').send({ company: 'Etched' }).expect(202)).body;
    expect(started).toMatchObject({ company: 'Etched', company_key: 'etched', status: 'running', result: { institution: 'Etched' } });
    await request(app).post('/api/research/paper-emails').send({ company: 'NVIDIA' }).expect(409); // one search at a time
    await paperEmailSearchDone('Etched');
    const done = (await request(app).get('/api/research/paper-emails?company=Etched').expect(200)).body;
    expect(done.status).toBe('done');
    expect(done.result.hits.map((h: { name: string; email: string }) => `${h.name} <${h.email}>`).sort()).toEqual(['Pat Example <pat@etched.example>', 'Robin Sample <robin@etched.example>']);
    expect(done.result).toMatchObject({ papers: 1, total: expect.any(Number) });
    // the same company under another spelling reads the same cached row; the list has it too
    expect((await request(app).get(`/api/research/paper-emails?company=${encodeURIComponent('Etched (Sohu)')}`)).body.status).toBe('done');
    expect((await request(app).get('/api/research/paper-emails').expect(200)).body).toHaveLength(1);
    await request(app).post('/api/research/paper-emails').send({}).expect(400);
  });

  it('a company missing from the institution map is a readable error; no PDF → none found', async () => {
    setup({ prime: false });
    primeResearchCache(fx.cfg.dataDir, { pdf: false });
    const { app } = appFor();
    await request(app).post('/api/research/paper-emails').send({ company: 'Micron' }).expect(202);
    await paperEmailSearchDone('Micron');
    expect((await request(app).get('/api/research/paper-emails?company=Micron')).body).toMatchObject({ status: 'error', error: expect.stringMatching(/not in targets\/openalex_institutions.json/) });
    await request(app).post('/api/research/paper-emails').send({ company: 'Etched' }).expect(202);
    await paperEmailSearchDone('Etched');
    const r = (await request(app).get('/api/research/paper-emails?company=Etched')).body;
    expect(r).toMatchObject({ status: 'done', result: { hits: [] } });
    expect(r.result.warnings.join(' ')).toMatch(/offline|cache|PDF/i);
  });
});

describe('emailMatchesName', () => {
  it.each([
    ['pat@etched.example', 'Pat Example', true], ['pexample@x.com', 'Pat Example', true], ['example.pat@x.com', 'Pat Example', true],
    ['patrick.example@x.com', 'Pat Example', true], ['example@x.com', 'Pat Example', true], ['pate@x.com', 'Pat Example', true],
    ['robin@etched.example', 'Pat Example', false], ['uni.person@university.example', 'Pat Example', false],
    ['jose.garcia@x.com', 'José García', true], ['hren@nvidia.com', 'Haoxing Mark Ren', true], ['ren@nvidia.com', 'Haoxing Mark Ren', false],
    ['info@x.com', 'Pat Example', false],
  ])('%s ↔ %s: %s', (email, name, ok) => { expect(emailMatchesName(email, name)).toBe(ok); });
});
