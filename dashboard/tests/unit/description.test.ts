// Job descriptions are never lost (2026-10-17): no overwrite by an empty/short/"posting removed" text (dashboard,
// cloud-sync merge), the replaced text kept in an event, and the plain-file copy applications/<dir>/JD.md.
import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { descriptionDecision } from '../../shared/description';
import { getJob, setDescription, setStatus } from '../../server/repo';
import { mergeJob } from '../../server/cloudSync';
import { descriptionMarkdown, KEEPER_MARKER, keepDescriptions } from '../../server/descriptionKeeper';
import { createApp } from '../../server/app';
import { makeFixture, type Fixture } from '../helpers';

const LONG = `<h2>About the role</h2><p>${'Design memory systems and processing-in-memory accelerators for AI workloads. '.repeat(12)}</p><ul><li>RTL</li><li>SystemVerilog</li></ul>`;

describe('descriptionDecision', () => {
  it('stores anything when nothing is stored', () => {
    expect(descriptionDecision('', LONG)).toEqual({ action: 'store', replaced: false });
    expect(descriptionDecision('', '')).toMatchObject({ action: 'keep' });
  });
  it('keeps the stored text against empty, "job removed", short or much shorter texts', () => {
    expect(descriptionDecision(LONG, '')).toMatchObject({ action: 'keep' });
    expect(descriptionDecision(LONG, '<p>Sorry, this job is no longer available.</p>')).toMatchObject({ action: 'keep' });
    expect(descriptionDecision(LONG, '<p>The page you are looking for: 404 Not Found</p>')).toMatchObject({ action: 'keep' });
    expect(descriptionDecision(LONG, 'Design memory systems.')).toMatchObject({ action: 'keep' });
    expect(descriptionDecision(LONG, LONG.slice(0, 400))).toMatchObject({ action: 'keep' });
    expect(descriptionDecision(LONG, LONG)).toEqual({ action: 'keep', reason: 'unchanged' });
  });
  it('replaces with a substantial, different text (an updated posting, or the full text after a teaser)', () => {
    expect(descriptionDecision(LONG, `${LONG}<p>Updated: also HBM.</p>`)).toEqual({ action: 'store', replaced: true });
    expect(descriptionDecision('AI is changing both the systems we build…', LONG)).toEqual({ action: 'store', replaced: true });
  });
});

describe('setDescription and the cloud merge never lose a description', () => {
  let fx: Fixture;
  beforeEach(() => { fx = makeFixture(); });
  afterEach(() => fx.cleanup());
  const add = (id: string, f: Record<string, unknown> = {}) => {
    const row = { id, company: 'Micron', title: 'Intern - Memory Systems Architecture', url: `https://example.com/${id}`, status: 'ranked', first_seen: '2026-10-01T00:00:00.000Z', ...f };
    fx.db.prepare(`INSERT INTO jobs(${Object.keys(row).join(', ')}) VALUES (${Object.keys(row).map(() => '?').join(', ')})`).run(...Object.values(row));
  };

  it('a "posting removed" page is ignored (event description_kept); a real update replaces it and keeps the old text in an event', () => {
    add('j1', { description: LONG, description_fetched_at: '2026-10-01T00:00:00.000Z' });
    expect(setDescription(fx.db, 'j1', '<p>This position has been filled.</p>').description).toBe(LONG);
    expect(fx.db.prepare("SELECT kind FROM events WHERE entity_id = 'j1'").all()).toEqual([{ kind: 'description_kept' }]);
    const next = `${LONG}<p>New: on-site in Boise.</p>`;
    expect(setDescription(fx.db, 'j1', next).description).toBe(next);
    const ev = fx.db.prepare("SELECT detail_json FROM events WHERE entity_id = 'j1' AND kind = 'description_replaced'").get() as { detail_json: string };
    expect(JSON.parse(ev.detail_json)).toMatchObject({ previous: LONG, previous_fetched_at: '2026-10-01T00:00:00.000Z' });
  });

  it('cloud merge: an emptied description on one side does not win', () => {
    const cols = ['id', 'description', 'updated_at'];
    const base = { colsKey: 'k', hashes: {}, updated_at: '2026-10-01T00:00:00.000Z' };
    const m = mergeJob(cols, { id: 'a', description: LONG, updated_at: '2026-10-01T00:00:00.000Z' }, { id: 'a', description: '', updated_at: '2026-10-05T00:00:00.000Z' }, null);
    expect(m.merged.description).toBe(LONG);
    expect(m.toCloud).toContain('description');
    const m2 = mergeJob(cols, { id: 'a', description: '', updated_at: '2026-10-06T00:00:00.000Z' }, { id: 'a', description: LONG, updated_at: '2026-10-01T00:00:00.000Z' }, base);
    expect(m2.merged.description).toBe(LONG);
    expect(m2.toLocal).toContain('description');
  });
});

describe('descriptionKeeper: fetch while live, save applications/<dir>/JD.md', () => {
  let fx: Fixture;
  beforeEach(() => { fx = makeFixture(); });
  afterEach(() => fx.cleanup());
  const add = (id: string, f: Record<string, unknown> = {}) => {
    const row = { id, company: 'Micron', title: 'Intern - Next-Generation HBM Architecture (Summer 2027)', url: `https://example.com/${id}`, status: 'ranked', first_seen: '2026-10-01T00:00:00.000Z', posted_date: '2026-09-30', location: 'Boise, ID', ...f };
    fx.db.prepare(`INSERT INTO jobs(${Object.keys(row).join(', ')}) VALUES (${Object.keys(row).map(() => '?').join(', ')})`).run(...Object.values(row));
  };
  const read = (rel: string) => fs.readFileSync(path.join(fx.root, rel), 'utf8');

  it('a new Applied job without a description: fetched, folder created and recorded, JD.md written; nothing to do the second time', async () => {
    add('wd:micron:JR1');
    setStatus(fx.db, 'wd:micron:JR1', 'applied');
    const calls: string[] = [];
    const fetcher = async (j: { id: string }) => { calls.push(j.id); return { description: LONG }; };
    const r = await keepDescriptions(fx.db, fx.root, { fetcher });
    expect(calls).toEqual(['wd:micron:JR1']);
    expect(r.fetched).toEqual(['wd:micron:JR1']);
    const dir = getJob(fx.db, 'wd:micron:JR1').application_dir!;
    expect(dir).toMatch(/^applications\/Micron_Intern_Next_Generation_HBM_Architecture_\d{4}-\d{2}-\d{2}$/);
    expect(r.written).toEqual([`${dir}/JD.md`]);
    const md = read(`${dir}/JD.md`);
    expect(md.startsWith(KEEPER_MARKER)).toBe(true);
    expect(md).toContain('- **Posting:** https://example.com/wd:micron:JR1');
    expect(md).toContain('### About the role');
    expect(md).toContain('- RTL\n- SystemVerilog');
    const again = await keepDescriptions(fx.db, fx.root, { fetcher });
    expect(again.written).toEqual([]);
    expect(calls).toHaveLength(1);
  });

  it('a hand-written JD.md (process decisions) is left alone: the posting goes to JD_full.md; ranked jobs are ignored', async () => {
    add('a', { status: 'apply_referral', description: LONG, description_fetched_at: '2026-10-02T00:00:00.000Z', application_dir: 'applications/Micron_HBM_2026-10-09' });
    add('b', { description: '' });
    fs.mkdirSync(path.join(fx.root, 'applications/Micron_HBM_2026-10-09'), { recursive: true });
    fs.writeFileSync(path.join(fx.root, 'applications/Micron_HBM_2026-10-09/JD.md'), '# My notes\n');
    const r = await keepDescriptions(fx.db, fx.root, { fetch: false });
    expect(r.written).toEqual(['applications/Micron_HBM_2026-10-09/JD_full.md']);
    expect(read('applications/Micron_HBM_2026-10-09/JD.md')).toBe('# My notes\n');
    expect(read('applications/Micron_HBM_2026-10-09/JD_full.md')).toContain('- **Description fetched:** 2026-10-02');
  });

  it('two kept jobs sharing one folder get one file each; a failed fetch is recorded and not retried for 6 h', async () => {
    add('x', { status: 'applied', description: LONG, application_dir: 'applications/AMD_2026-10-09' });
    add('y', { status: 'applied', description: '', application_dir: 'applications/AMD_2026-10-09' });
    let n = 0;
    const fetcher = async () => { n++; throw new Error('HTTP 404'); };
    const r = await keepDescriptions(fx.db, fx.root, { fetcher });
    expect(r.failed).toEqual([{ id: 'y', error: 'HTTP 404' }]);
    expect(r.written.sort()).toEqual(['applications/AMD_2026-10-09/JD_full_x.md', 'applications/AMD_2026-10-09/JD_full_y.md']);
    await keepDescriptions(fx.db, fx.root, { fetcher });
    expect(n).toBe(1);
    await keepDescriptions(fx.db, fx.root, { fetcher, now: new Date(Date.now() + 7 * 3600e3) });
    expect(n).toBe(2);
  });

  it('API: GET saved-jd gives the file, POST open-saved-jd answers (no window in tests); 404 without a file', async () => {
    add('k', { status: 'applied', description: LONG, application_dir: 'applications/K_2026-10-09' });
    await keepDescriptions(fx.db, fx.root, { fetch: false });
    const app = createApp(fx.ctx, { exportDelayMs: 0 }).app;
    expect((await request(app).get('/api/jobs/k/saved-jd')).body).toEqual({ path: 'applications/K_2026-10-09/JD.md' });
    expect((await request(app).post('/api/jobs/k/open-saved-jd').set('Content-Type', 'application/json').send({})).body).toEqual({ opened: 'applications/K_2026-10-09/JD.md' });
    add('none');
    expect((await request(app).post('/api/jobs/none/open-saved-jd').set('Content-Type', 'application/json').send({})).status).toBe(404);
  });

  it('descriptionMarkdown decodes entities and keeps list items together', () => {
    expect(descriptionMarkdown('<p>We&rsquo;re hiring &mdash; now</p><ul><li><p>One</p></li><li><p>Two</p></li></ul>')).toBe('We’re hiring — now\n- One\n- Two');
    expect(descriptionMarkdown('plain text')).toBe('plain text');
  });
});
