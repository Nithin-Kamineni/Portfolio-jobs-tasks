import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { importInboxDir, importInboxText, migrateTracker, mirrorCompanies, parseDigest, importPeople } from '../../server/importer';
import { trackerCsv, exportTracker, TRACKER_COLUMNS } from '../../server/exporter';
import { getJob, listJobs, rankJob, setStatus, updateJob, addContact, addOutreach, markSent } from '../../server/repo';
import { openDb } from '../../server/db';
import { DIGEST_MD, inboxLine, makeFixture, type Fixture } from '../helpers';
import { parseCSV } from '../../../watcher/lib/util.js';

let fx: Fixture;
afterEach(() => fx?.cleanup());

describe('inbox import', () => {
  it('imports a JSONL file and is idempotent (twice → no duplicates)', () => {
    fx = makeFixture({ tracker: false });
    mirrorCompanies(fx.db, fx.root);
    const text = [inboxLine({ id: 'wd:nvidia:1' }), inboxLine({ id: 'gh:x:2', company: 'Etched', title: 'RTL Intern' })].join('\n') + '\n';
    fs.writeFileSync(path.join(fx.root, 'jobs/inbox/2026-09-30_1200.jsonl'), text);
    expect(importInboxDir(fx.db, fx.root)).toEqual({ files: ['jobs/inbox/2026-09-30_1200.jsonl'], jobs: 2 });
    expect(importInboxDir(fx.db, fx.root)).toEqual({ files: [], jobs: 0 });
    // the same records under another file name add nothing either
    expect(importInboxText(fx.db, 'jobs/inbox/copy.jsonl', text)).toBe(0);
    expect(listJobs(fx.db)).toHaveLength(2);
    const j = getJob(fx.db, 'wd:nvidia:1');
    expect(j).toMatchObject({ status: 'new', company_priority: 'A', tags: ['ASIC/RTL'], has_description: true, posted_date: '2026-09-28' });
    expect(j.description).toBe('Build ASIC RTL.');
  });

  it('skips bad lines and records without id or title', () => {
    fx = makeFixture({ tracker: false });
    const n = importInboxText(fx.db, 'jobs/inbox/x.jsonl', `${inboxLine({ id: 'a:1' })}\n{not json\n${JSON.stringify({ id: 'b:2' })}\n\n`);
    expect(n).toBe(1);
  });

  it('never overwrites decisions, ranks or notes, but fills a missing description', () => {
    fx = makeFixture({ tracker: false });
    importInboxText(fx.db, 'jobs/inbox/1.jsonl', inboxLine({ id: 'j:1', description: '' }));
    rankJob(fx.db, 'j:1', 80, 'Strong PIM fit');
    setStatus(fx.db, 'j:1', 'applied');
    updateJob(fx.db, 'j:1', { notes: 'my note' });
    importInboxText(fx.db, 'jobs/inbox/2.jsonl', inboxLine({ id: 'j:1', title: 'Changed', description: 'Now with HBM and ECC details.', score: 1 }));
    const j = getJob(fx.db, 'j:1');
    expect(j).toMatchObject({ status: 'applied', fit_score: 80, notes: 'my note', title: 'Hardware Intern', score: 20 });
    expect(j.description).toBe('Now with HBM and ECC details.');
    expect(j.tags).toEqual(expect.arrayContaining(['Memory/PIM', 'Reliability/ECC']));
  });

  it('derives tags and flags when the record has none', () => {
    fx = makeFixture({ tracker: false });
    importInboxText(fx.db, 'jobs/inbox/1.jsonl', JSON.stringify({ id: 's:1', company: 'X', title: 'PhD Compiler Intern', sponsorship: 'Does Not Offer Sponsorship', first_seen: '2026-09-30T00:00:00Z' }));
    const j = getJob(fx.db, 's:1');
    expect(j.tags).toEqual(['PhD', 'Compiler/MLIR']);
    expect(j.flags).toEqual(['No sponsorship']);
  });
});

describe('digest parsing', () => {
  it('reads rows, hits, degrees and source errors', () => {
    const d = parseDigest(DIGEST_MD, 'jobs/digests/2026-09-29_2209.md');
    expect(d.at).toBe('2026-09-29T22:09:00.000Z');
    expect(d.rows).toHaveLength(3);
    expect(d.rows[0]).toMatchObject({ score: 59, company: 'Micron', posted_raw: 'Posted 14 Days Ago', hits: ['memory system', 'phd', 'computer architecture', 'ai accelerator'] });
    expect(d.rows[2]).toMatchObject({ degrees: "PhD/Master's", hits: ['rtl', 'asic'] });
    expect(d.errors).toEqual(['Qualcomm (pcsx): HTTP 429 for https://careers.qualcomm.com/api', 'SimplifyJobs: fetch failed']);
  });

  it('a digest without errors has none', () => {
    expect(parseDigest('# Job digest: 2026-09-30 12:00 UTC\n\n_None._\n').errors).toEqual([]);
  });
});

describe('tracker.csv migration', () => {
  it('imports the watcher-format tracker once, enriched from the digests', () => {
    fx = makeFixture();
    mirrorCompanies(fx.db, fx.root);
    expect(migrateTracker(fx.db, fx.root)).toBe(3);
    expect(migrateTracker(fx.db, fx.root)).toBeNull();
    const micron = getJob(fx.db, 'wd:micron:JR111017');
    expect(micron).toMatchObject({
      company_priority: 'A', status: 'new', score: 59, first_seen: '2026-09-29T22:09:00.000Z', posted_date: '2026-09-15',
      hits: ['memory system', 'phd', 'computer architecture', 'ai accelerator'],
    });
    expect(micron.tags).toEqual(expect.arrayContaining(['PhD', 'Memory/PIM', 'Architecture', 'AI accelerator']));
    expect(getJob(fx.db, 'simplify:abc-1')).toMatchObject({ degrees: "PhD/Master's", company_priority: 'B', posted_date: '2026-08-01', ats: 'ashby' });
    expect(getJob(fx.db, 'simplify:abc-1').flags).toContain('Posted > 30 days');
  });

  it('mirrors companies.csv and back-fills priorities', () => {
    fx = makeFixture();
    migrateTracker(fx.db, fx.root);
    expect(getJob(fx.db, 'wd:nvidia:JR2026584').company_priority).toBe('');
    expect(mirrorCompanies(fx.db, fx.root)).toBe(6);
    expect(getJob(fx.db, 'wd:nvidia:JR2026584').company_priority).toBe('A');
  });

  it('imports people.csv once', () => {
    fx = makeFixture({ files: { 'targets/people.csv': 'name,company,team_or_lab,relationship,how_met,paper_or_topic,email_or_linkedin,email_source,status,date_contacted,follow_up_due,notes\nA. Friend,NVIDIA,,friend,UF,,https://linkedin.com/in/a,,,,,\nB. Res,Micron,Pathfinding,researcher,,PIM,b@micron.com,ISCA paper,,,,\n' } });
    expect(importPeople(fx.db, fx.root)).toBe(2);
    expect(importPeople(fx.db, fx.root)).toBeNull();
    const rows = fx.db.prepare('SELECT name, relationship, linkedin_url, email, email_confidence FROM contacts ORDER BY name').all();
    expect(rows).toEqual([
      { name: 'A. Friend', relationship: 'friend', linkedin_url: 'https://linkedin.com/in/a', email: null, email_confidence: null },
      { name: 'B. Res', relationship: 'researcher', linkedin_url: null, email: 'b@micron.com', email_confidence: 'from_paper' },
    ]);
  });
});

describe('tracker.csv export', () => {
  it('writes every job with the documented columns', () => {
    fx = makeFixture();
    mirrorCompanies(fx.db, fx.root); migrateTracker(fx.db, fx.root);
    const r = exportTracker(fx.db, fx.root);
    expect(r).toMatchObject({ rows: 3, warning: null });
    const rows = parseCSV(fs.readFileSync(path.join(fx.root, 'jobs/tracker.csv'), 'utf8'));
    expect(Object.keys(rows[0])).toEqual([...TRACKER_COLUMNS]);
    expect(rows.map((x) => x.id).sort()).toEqual(['simplify:abc-1', 'wd:micron:JR111017', 'wd:nvidia:JR2026584']);
  });

  it('round-trips: export → import into a fresh database gives the same rows', () => {
    fx = makeFixture();
    mirrorCompanies(fx.db, fx.root); migrateTracker(fx.db, fx.root);
    rankJob(fx.db, 'wd:micron:JR111017', 91, 'PIM + memory systems, "exact" match, with, commas');
    setStatus(fx.db, 'wd:micron:JR111017', 'apply_referral');
    setStatus(fx.db, 'wd:micron:JR111017', 'applied');
    updateJob(fx.db, 'wd:micron:JR111017', { notes: 'line one\nline "two"', application_dir: 'applications/Micron_AI_2026-09-30' });
    setStatus(fx.db, 'wd:nvidia:JR2026584', 'skip');
    const c = addContact(fx.db, { name: 'F', company: 'Micron', relationship: 'friend' });
    const o = addOutreach(fx.db, { type: 'referral', contact_id: c.id, job_id: 'wd:micron:JR111017', body: 'Hi' });
    markSent(fx.db, o.id);
    const csv = trackerCsv(fx.db);
    exportTracker(fx.db, fx.root);

    const db2 = openDb(':memory:');
    mirrorCompanies(db2, fx.root);
    expect(migrateTracker(db2, fx.root)).toBe(3);
    const pick = (j: ReturnType<typeof listJobs>[number]) => {
      const { updated_at: _u, description: _d, has_description: _h, description_fetched_at: _f, ...rest } = j;
      return rest;
    };
    expect(listJobs(db2, { sort: 'company' }).map(pick)).toEqual(listJobs(fx.db, { sort: 'company' }).map(pick));
    expect(trackerCsv(db2).replace(/,sent,/, ',,')).toBe(csv.replace(/,sent,/, ',,'));
    expect(csv).toContain(',sent,'); // the referral column
    db2.close();
  });

  it('a locked tracker.csv gives a warning, not an error', () => {
    fx = makeFixture();
    fs.rmSync(path.join(fx.root, 'jobs', 'tracker.csv'));
    fs.mkdirSync(path.join(fx.root, 'jobs', 'tracker.csv')); // a directory can't be written as a file
    const r = exportTracker(fx.db, fx.root);
    expect(r.warning).toMatch(/Couldn't write jobs\/tracker.csv/);
  });
});
