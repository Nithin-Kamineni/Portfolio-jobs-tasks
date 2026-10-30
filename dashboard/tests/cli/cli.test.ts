import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { makeFixture, type Fixture } from '../helpers';
import { openDb } from '../../server/db';
import { ETCHED_DOI, ETCHED_PDF, primeResearchCache, writeTestMap } from '../fixtures/research';

const CLI = path.resolve(__dirname, '../../cli/index.js');
let fx: Fixture;

function cli(...args: string[]): { code: number | null; json: Record<string, unknown>; raw: string } {
  const r = spawnSync(process.execPath, [CLI, ...args], {
    cwd: fx.root, encoding: 'utf8', timeout: 30000,
    env: { ...process.env, JOBWATCHER_REPO: fx.root, JOBWATCHER_DATA: path.join(fx.root, 'data'), JOBWATCHER_DB: '', JOBWATCHER_GIT: 'off' },
  });
  let json: Record<string, unknown>;
  try { json = JSON.parse(r.stdout); } catch { throw new Error(`Not JSON (exit ${r.status}):\n${r.stdout}\n${r.stderr}`); }
  return { code: r.status, json, raw: r.stdout };
}

const MICRON = 'wd:micron:JR111017';

beforeAll(() => { fx = makeFixture(); fx.db.close(); });
afterAll(() => fx.cleanup());

describe('CLI (every command prints valid JSON)', () => {
  it('sync', () => {
    const r = cli('sync');
    expect(r.code).toBe(0);
    expect(r.json).toMatchObject({ pulled: true, warning: null });
  });

  it('jobs with filters', () => {
    const all = cli('jobs');
    expect(all.json.count).toBe(3);
    const n = cli('jobs', '--status', 'new', '--company', 'micron', '--limit', '5');
    expect(n.json.count).toBe(1);
    expect((n.json.jobs as { id: string }[])[0]).toMatchObject({ id: MICRON, priority: 'A', has_description: false });
    expect(cli('jobs', '--tag', 'Memory/PIM').json.count).toBe(1);
    expect(cli('jobs', '--priority', 'B').json.count).toBe(1);
    expect((cli('jobs', '--full', '--limit', '1').json.jobs as Record<string, unknown>[])[0]).toHaveProperty('hits');
  });

  it('job <id>', () => {
    const r = cli('job', MICRON);
    expect(r.json.job).toMatchObject({ id: MICRON, description: '' });
    expect(r.json).toHaveProperty('contacts');
    expect(cli('job', 'nope').code).toBe(1);
  });

  it('rank persists fit and moves new → ranked', () => {
    const r = cli('rank', MICRON, '--fit', '88', '--reason', 'Memory systems + PIM; PhD preferred');
    expect(r.code).toBe(0);
    expect(r.json.job).toMatchObject({ status: 'ranked', fit_score: 88 });
    expect(cli('job', MICRON).json.job).toMatchObject({ fit_score: 88, fit_reason: 'Memory systems + PIM; PhD preferred', status: 'ranked' });
    expect(cli('rank', MICRON, '--fit', '150', '--reason', 'x').json.error).toMatch(/0 to 100/);
    expect(cli('rank', MICRON, '--fit', '50').code).toBe(1);
  });

  it('status persists, with note and application dir; invalid ones fail', () => {
    expect(cli('status', MICRON, 'apply_referral').json.job).toMatchObject({ status: 'apply_referral' });
    // the same status again with --dir only records the folder (and the note)
    const r = cli('status', MICRON, 'apply_referral', '--note', 'Folder ready', '--dir', 'applications/Micron_AI_2026-09-30');
    expect(r.json).toMatchObject({ application_dir: 'applications/Micron_AI_2026-09-30' });
    expect(cli('job', MICRON).json.job).toMatchObject({ status: 'apply_referral', notes: expect.stringContaining('Folder ready') });
    expect(cli('status', MICRON, 'apply_direct').json.job).toMatchObject({ status: 'applied' }); // the old name = applied
    const bad = cli('status', 'wd:nvidia:JR2026584', 'interview');
    expect(bad.code).toBe(1);
    expect(bad.json.error).toMatch(/Can't change status/);
    const removed = cli('status', MICRON, 'prepared');
    expect(removed.code).toBe(1);
    expect(removed.json.error).toMatch(/"prepared" was removed/);
  });

  it('note appends', () => {
    expect(cli('note', MICRON, 'Recruiter emailed').json.notes).toMatch(/Folder ready[\s\S]*Recruiter emailed/);
  });

  it('contact add / list / update', () => {
    const papers = JSON.stringify([{ title: 'HBM-PIM for LLMs', venue: 'ISCA', year: 2026, url: 'https://doi.org/x' }]);
    const r = cli('contact', 'add', '--name', 'Dr. Kim', '--company', 'Micron', '--relationship', 'researcher', '--email', 'kim@micron.com',
      '--email-source', 'ISCA 2026 paper PDF', '--confidence', 'from_paper', '--summary', 'Works on HBM-PIM.', '--papers', papers);
    expect(r.code).toBe(0);
    expect(r.json.contact).toMatchObject({ id: 1, email_confidence: 'from_paper', papers: [{ venue: 'ISCA' }] });
    expect(cli('contact', 'list', '--company', 'Micron').json.count).toBe(1);
    expect((cli('contact', 'update', '1', '--title-or-lab', 'Pathfinding').json.contact as { title_or_lab: string }).title_or_lab).toBe('Pathfinding');
    expect(cli('contact', 'add', '--name', 'X', '--email', 'x@y.com').json.error).toMatch(/confidence/);
    expect(cli('contact', 'add', '--name', 'X', '--papers', 'not json').json.error).toMatch(/JSON array/);
  });

  it('outreach add (body file) / list / update persist', () => {
    const draft = path.join(fx.root, 'draft.txt');
    fs.writeFileSync(draft, 'Dear Dr. Kim,\r\n\r\nI read your ISCA paper.\r\n');
    const r = cli('outreach', 'add', '--type', 'cold_email', '--contact', '1', '--job', MICRON, '--subject', 'HBM-PIM question', '--body-file', draft);
    expect(r.code).toBe(0);
    expect(r.json.outreach).toMatchObject({ id: 1, type: 'cold_email', channel: 'email', status: 'draft', body: 'Dear Dr. Kim,\n\nI read your ISCA paper.' });
    expect(cli('outreach', 'list', '--status', 'draft').json.count).toBe(1);
    expect(cli('outreach', 'update', '1', '--status', 'ready').json.outreach).toMatchObject({ status: 'ready' });
    expect(cli('outreach', 'list', '--due').json.count).toBe(0);
    expect(cli('outreach', 'add', '--type', 'referral', '--contact', '1').json.error).toMatch(/body is required/);
    expect(cli('outreach', 'add', '--type', 'referral', '--contact', '1', '--body-file', 'missing.txt').json.error).toMatch(/No such file/);
    const db = openDb(path.join(fx.root, 'data', 'jobwatcher.db'));
    expect(db.prepare('SELECT subject, status FROM outreach WHERE id = 1').get()).toEqual({ subject: 'HBM-PIM question', status: 'ready' });
    db.close();
  });

  it('mark, facts, companies, export', () => {
    expect(cli('mark', 'weekly_review').json).toMatchObject({ kind: 'weekly_review' });
    expect(cli('mark', 'coffee').code).toBe(1);
    const f = cli('facts').json;
    expect(f).toMatchObject({ newCount: 2, researcherCount: 1, lastWeeklyReview: expect.any(String) });
    expect((cli('companies').json.companies as unknown[]).length).toBe(6);
    const e = cli('export').json;
    expect(e).toMatchObject({ rows: 3, warning: null });
    const csv = fs.readFileSync(path.join(fx.root, 'jobs', 'tracker.csv'), 'utf8');
    expect(csv).toContain('applications/Micron_AI_2026-09-30');
  });

  it('unknown commands and missing values are JSON errors', () => {
    expect(cli('frobnicate')).toMatchObject({ code: 1, json: { error: expect.stringMatching(/Unknown command/) } });
    expect(cli('jobs', '--status')).toMatchObject({ code: 1, json: { error: '--status needs a value' } });
  });

  it('help prints usage text', () => {
    const r = spawnSync(process.execPath, [CLI, 'help'], { encoding: 'utf8' });
    expect(r.stdout).toMatch(/node dashboard\/cli <command>/);
  });
});

describe('CLI v2 (P4): job add, manual-checked, prerank, jobs --for-ranking, rank --stage', () => {
  it('jobs --for-ranking prints compact cards of new, unscored jobs', () => {
    const r = cli('jobs', '--for-ranking', '--limit', '5');
    expect(r.code).toBe(0);
    expect(r.json).toMatchObject({ count: 2, remaining: 0 }); // NVIDIA + Etched (Micron was ranked above)
    const card = (r.json.cards as Record<string, unknown>[])[0];
    expect(Object.keys(card).sort()).toEqual(['company', 'degrees', 'flags', 'has_description', 'hits', 'id', 'location', 'posted', 'score', 'tags', 'text', 'title']);
  });

  it('rank --stage quick / final; bad stage is an error', () => {
    expect(cli('rank', 'simplify:abc-1', '--fit', '33', '--reason', 'RTL only', '--stage', 'quick').json).toMatchObject({ rank_stage: 'quick' });
    expect(cli('rank', 'simplify:abc-1', '--fit', '40', '--reason', 'checked', '--stage', 'final', '--model', 'opus').json).toMatchObject({ rank_stage: 'final' });
    expect(cli('rank', 'simplify:abc-1', '--fit', '40', '--reason', 'x', '--stage', 'best').json.error).toMatch(/--stage must be/);
    expect((cli('jobs', '--for-ranking').json.cards as { id: string }[]).map((c) => c.id)).toEqual(['wd:nvidia:JR2026584']);
  });

  it('job add: adds with a description file, rejects non-matches with a reason, same URL is a no-op', () => {
    const file = path.join(fx.root, 'desc.txt');
    fs.writeFileSync(file, 'PhD research intern: processing-in-memory accelerators, HBM memory systems, computer architecture. '.repeat(3));
    const a = cli('job', 'add', '--company', 'Meta', '--title', 'PhD Research Intern, MTIA Architecture', '--url', 'https://www.metacareers.com/jobs/42/?utm_source=x',
      '--location', 'Menlo Park, CA', '--posted', '2026-09-28', '--description-file', file, '--source', 'manual:Meta');
    expect(a.code).toBe(0);
    expect(a.json).toMatchObject({ added: true, job: { company: 'Meta', status: 'new' } });
    expect(cli('job', 'add', '--company', 'Meta', '--title', 'PhD Research Intern, MTIA Architecture', '--url', 'https://metacareers.com/jobs/42', '--location', 'Menlo Park, CA', '--description-file', file).json)
      .toMatchObject({ added: false, reason: 'already added earlier' });
    const bad = cli('job', 'add', '--company', 'Meta', '--title', 'Sales Intern', '--url', 'https://metacareers.com/jobs/43', '--location', 'Menlo Park, CA');
    expect(bad.code).toBe(1);
    expect(bad.json.error).toMatch(/^Not added: the title/);
    expect(cli('job', 'add', '--company', 'Meta', '--title', 'X Intern', '--url', 'https://m.example/1', '--description-file', 'nope.txt').json.error).toMatch(/No such file/);
  });

  it('manual-checked and manual-companies', () => {
    expect(cli('manual-checked', 'Meta', '--found', '3', '--added', '1', '--result', 'ok').json).toMatchObject({ check: { company: 'Meta', found: 3, added: 1, result: 'ok' } });
    const m = cli('manual-companies').json as { everyHours: number; companies: { name: string; due: boolean }[] };
    expect(m.everyHours).toBe(24);
    expect(m.companies.find((c) => c.name === 'Meta')?.due).toBe(false);
    expect(m.companies.find((c) => c.name.startsWith('Tesla'))?.due).toBe(true);
    expect(cli('manual-checked', 'Meta', '--result', 'maybe').code).toBe(1);
  });

  it('prerank --no-fetch settles rule cases only', () => {
    const r = cli('prerank', '--no-fetch');
    expect(r.code).toBe(0);
    expect(r.json).toMatchObject({ fetched: 0, closed: [] });
    expect(r.json).toHaveProperty('settled');
  });
});

describe('CLI v2 (P6): research candidates / pdf-emails / mark, contact LinkedIn + OpenAlex fields', () => {
  beforeAll(() => { writeTestMap(fx.root); primeResearchCache(path.join(fx.root, 'data')); });

  it('research candidates (offline, recorded responses), --no-fetch, --ids, mark', () => {
    const r = cli('research', 'candidates', '--companies', 'Etched', '--since', '2024', '--limit', '5');
    expect(r.code).toBe(0);
    expect(r.json).toMatchObject({ companies: ['Etched'], venues: expect.arrayContaining(['ISCA', 'IEEE Micro']), since: 2024, requests: 0 });
    const cands = r.json.candidates as { id: number; name: string; papers: { pdf_url: string | null }[] }[];
    expect(cands.map((c) => c.name).sort()).toEqual(['Pat Example', 'Robin Sample']);
    expect(cli('research', 'candidates', '--companies', 'Etched', '--no-fetch').json.found).toBe(0);
    const m = cli('research', 'mark', String(cands[0].id), 'skipped');
    expect((m.json.candidates as { status: string }[])[0].status).toBe('skipped');
    expect((cli('research', 'candidates', '--ids', String(cands[0].id)).json.candidates as unknown[])).toHaveLength(1);
    expect(cli('research', 'mark', String(cands[0].id), 'contacted').json.error).toMatch(/status must be/);
    expect(cli('research', 'candidates', '--venues', 'NeurIPS').json.error).toMatch(/Unknown venue/);
    expect(cli('research', 'candidates', '--ids', 'x').json.error).toMatch(/--ids/);
  });

  it('research pdf-emails <url> | --doi', () => {
    const r = cli('research', 'pdf-emails', ETCHED_PDF);
    expect(r.code).toBe(0);
    expect(r.json).toMatchObject({ pages: 1, emails: ['pat@etched.example', 'robin@etched.example', 'uni.person@university.example'] });
    expect(r.json.authorBlock).toMatch(/Pat Example, Uni Person, Robin Sample/);
    expect(cli('research', 'pdf-emails', '--doi', ETCHED_DOI).json.url).toBe(ETCHED_PDF);
    expect(cli('research', 'pdf-emails').json.error).toMatch(/PDF link/);
    expect(cli('research', 'nope').json.error).toMatch(/Use: research/);
  });

  it('research paper-emails <company>: only addresses printed on the paper that match a company author; --cached', () => {
    const r = cli('research', 'paper-emails', 'Etched');
    expect(r.code).toBe(0);
    const search = r.json.search as { status: string; result: { hits: { name: string; email: string; paper: { title: string; venue: string; pdf_url: string } }[]; checked: number } };
    expect(search.status).toBe('done');
    expect(search.result.hits.map((h) => [h.name, h.email]).sort()).toEqual([['Pat Example', 'pat@etched.example'], ['Robin Sample', 'robin@etched.example']]);
    expect(search.result.hits[0].paper).toMatchObject({ title: 'Sparse Transformer Inference with Near-Memory Processing on HBM', venue: 'ISCA', pdf_url: ETCHED_PDF });
    // the university co-author's address is on the paper too, but he is not at the company
    expect(JSON.stringify(search)).not.toContain('uni.person');
    expect((cli('research', 'paper-emails', 'Etched', '--cached').json.search as { result: { hits: unknown[] } }).result.hits).toHaveLength(2);
    const unknown = cli('research', 'paper-emails', 'Nowhere Inc');
    expect(unknown.json.search).toMatchObject({ status: 'error', error: expect.stringMatching(/not in targets\/openalex_institutions.json/) });
  });

  it('company-note get / set / clear; company-notes lists them', () => {
    expect(cli('company-note', 'Micron').json.note).toBeNull();
    expect(cli('company-note', 'Micron', '--set', 'Asked Sam for a referral').json.note).toMatchObject({ company_key: 'micron', note: 'Asked Sam for a referral' });
    expect(cli('company-note', 'Micron Technology').json.note).toMatchObject({ note: 'Asked Sam for a referral' });
    expect((cli('company-notes').json.notes as unknown[])).toHaveLength(1);
    cli('company-note', 'Micron', '--set', '');
    expect((cli('company-notes').json.notes as unknown[])).toHaveLength(0);
  });

  it('contact add with --linkedin-confidence/--linkedin-source/--openalex-id; in a run a link is search_match', () => {
    const r = cli('contact', 'add', '--name', 'Pat Example', '--company', 'Etched', '--relationship', 'researcher', '--openalex-id', 'A9000000001',
      '--linkedin', 'linkedin.com/in/pat-example', '--linkedin-confidence', 'search_match', '--linkedin-source', 'web search: "Pat Example" Etched LinkedIn');
    expect(r.code).toBe(0);
    expect(r.json.contact).toMatchObject({ linkedin_url: 'https://www.linkedin.com/in/pat-example', linkedin_confidence: 'search_match', openalex_id: 'A9000000001' });
    expect(cli('contact', 'add', '--name', 'Pat Example', '--company', 'Etched').json.error).toMatch(/Already a contact/);
    expect(cli('contact', 'add', '--name', 'X', '--company', 'Etched', '--linkedin', 'https://example.com/x').json.error).toMatch(/not a LinkedIn profile link/);
    const inRun = spawnSync(process.execPath, [CLI, 'contact', 'add', '--name', 'Robin Sample', '--company', 'Etched', '--linkedin', 'https://www.linkedin.com/in/robin-s'], {
      cwd: fx.root, encoding: 'utf8', env: { ...process.env, JOBWATCHER_REPO: fx.root, JOBWATCHER_DATA: path.join(fx.root, 'data'), JOBWATCHER_DB: '', JOBWATCHER_GIT: 'off', JOBWATCHER_RUN_ID: '42' },
    });
    expect(JSON.parse(inRun.stdout).contact).toMatchObject({ linkedin_confidence: 'search_match' });
    // Both are contacts now: the candidates say so.
    const all = cli('research', 'candidates', '--companies', 'Etched', '--no-fetch', '--all').json.candidates as { status: string }[];
    expect(all.map((c) => c.status)).toEqual(['contacted', 'contacted']);
  });
});
