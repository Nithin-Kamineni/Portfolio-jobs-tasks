// Each posting once (2026-10-17): canonical URLs for every URL shape in the real data, the merge rules, applying
// another PC's aliases, and the importer mapping a re-import to the kept job.
import { afterEach, describe, expect, it } from 'vitest';
import { openDb, type DB } from '../../server/db';
import { applyAliases, dedupeJobs, legacyNormalizeUrl, mergedFields, normalizeUrl, reqIdFrom } from '../../server/dedupe';
import { upsertJobs } from '../../server/importer';
import { cloudSync, type D1 } from '../../server/cloudSync';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MIG = (n: string) => fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../fixtures/site-migrations', n), 'utf8');

const dbs: DB[] = [];
afterEach(() => { while (dbs.length) dbs.pop()!.close(); });
const mem = () => { const d = openDb(':memory:'); dbs.push(d); return d; };

const T0 = '2026-10-01T00:00:00.000Z';
function addJob(db: DB, id: string, f: Record<string, unknown> = {}) {
  const row = { id, company: 'AMD', title: `Intern ${id}`, url: `https://example.com/${id}`, status: 'ranked', first_seen: T0, updated_at: T0, ...f };
  const k = Object.keys(row);
  db.prepare(`INSERT INTO jobs(${k.join(', ')}) VALUES (${k.map(() => '?').join(', ')})`).run(...Object.values(row));
}
const job = (db: DB, id: string) => db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as Record<string, unknown> | undefined;

describe('normalizeUrl: one canonical key per posting', () => {
  const same = (a: string, b: string) => expect(normalizeUrl(a)).toBe(normalizeUrl(b));
  const differ = (a: string, b: string) => expect(normalizeUrl(a)).not.toBe(normalizeUrl(b));

  it('careers.amd.com: ?lang= (Jibe feed) and ?icims= (SimplifyJobs) are the same posting; other ids differ', () => {
    same('https://careers.amd.com/jobs/92342?lang=en-us', 'https://careers.amd.com/jobs/92342?icims=1');
    same('https://careers.amd.com/jobs/92342', 'https://careers.amd.com/careers-home/jobs/92342?lang=en-us');
    differ('https://careers.amd.com/jobs/92342?lang=en-us', 'https://careers.amd.com/jobs/92346?lang=en-us');
    expect(normalizeUrl('https://careers.amd.com/jobs/92342?lang=en-us')).toBe('https://careers.amd.com/jobs/92342');
  });
  it('Ashby: …/<id>/application?embed=true and a different-case board are the posting page', () => {
    same('https://jobs.ashbyhq.com/etched/157ed4f4-6e3b-4ec9-b93f-3e363e92041e', 'https://jobs.ashbyhq.com/Etched/157ed4f4-6e3b-4ec9-b93f-3e363e92041e/application?embed=true');
  });
  it('Lever …/apply, fragments, www, trailing slash, tracking parameters', () => {
    same('https://jobs.lever.co/CesiumAstro/e6d87528-5da1-4970-9e42-7b224cfa63a9/apply', 'https://jobs.lever.co/cesiumastro/e6d87528-5da1-4970-9e42-7b224cfa63a9/');
    same('https://www.metacareers.com/jobs/111/?utm_source=x#apply', 'https://metacareers.com/jobs/111');
  });
  it('identifying query parameters stay (IBM jobId, Greenhouse gh_jid on company sites)', () => {
    differ('https://careers.ibm.com/careers/JobDetail?jobId=132725', 'https://careers.ibm.com/careers/JobDetail?jobId=132416');
    differ('https://careers.withwaymo.com/jobs?gh_jid=8223735', 'https://careers.withwaymo.com/jobs?gh_jid=8214350');
    same('https://careers.ibm.com/careers/JobDetail?jobId=132725&lang=en', 'https://careers.ibm.com/careers/JobDetail?jobId=132725');
  });
  it('Greenhouse board hosts and the embed URL', () => {
    same('https://boards.greenhouse.io/lightmatter/jobs/5425407008', 'https://job-boards.greenhouse.io/lightmatter/jobs/5425407008');
    same('https://boards.greenhouse.io/embed/job_app?for=xai&token=4455667', 'https://job-boards.greenhouse.io/xai/jobs/4455667');
  });
  it('Workday locale; Amazon, Apple, Google, SmartRecruiters and Microsoft slugs', () => {
    same('https://intel.wd1.myworkdayjobs.com/en-US/External/job/US-Oregon-Hillsboro/X_JR0287314', 'https://intel.wd1.myworkdayjobs.com/External/job/US-Oregon-Hillsboro/X_JR0287314?source=simplify');
    same('https://www.amazon.jobs/en/jobs/3012345/mechatronic-apprentice-i', 'https://amazon.jobs/jobs/3012345');
    same('https://jobs.apple.com/en-us/details/200612345/machine-learning-intern', 'https://jobs.apple.com/details/200612345');
    same('https://www.google.com/about/careers/applications/jobs/results/123456789-student-researcher-2027', 'https://www.google.com/about/careers/applications/jobs/results/123456789');
    same('https://jobs.smartrecruiters.com/WesternDigital/744000140949875-intern-firmware', 'https://jobs.smartrecruiters.com/WesternDigital/744000140949875');
    same('https://apply.careers.microsoft.com/careers/job/1970393556780', 'https://jobs.careers.microsoft.com/global/en/job/1970393556780/Hardware-Engineering-Intern');
    differ('https://apply.careers.microsoft.com/careers/job/1970393556780', 'https://apply.careers.microsoft.com/careers/job/1970393556781');
  });
  it('the legacy form is unchanged (manual job ids stay stable)', () => {
    expect(legacyNormalizeUrl('https://careers.amd.com/jobs/92342?lang=en-us')).toBe('https://careers.amd.com/jobs/92342?lang=en-us');
  });
});

describe('reqIdFrom', () => {
  it('Workday copies (-1, -2) are the same requisition; different reqs differ', () => {
    expect(reqIdFrom('https://marvell.wd1.myworkdayjobs.com/MarvellCareers/job/Santa-Clara-CA/Architecture-Intern--MS---Summer-2027_2604436-1'))
      .toBe(reqIdFrom('https://marvell.wd1.myworkdayjobs.com/MarvellCareers2/job/Santa-Clara-CA/Architecture-Intern--MS---Summer-2027_2604436'));
    expect(reqIdFrom('https://gevernova.wd5.myworkdayjobs.com/x/job/Rochester/GE_R5051649-2')).toBe('R5051649');
    expect(reqIdFrom('https://micron.wd1.myworkdayjobs.com/External/job/Boise/Intern_JR111814')).not.toBe(reqIdFrom('https://micron.wd1.myworkdayjobs.com/External/job/Boise/Intern_JR111821'));
  });
  it('Oracle HCM: careers.ti.com and the oraclecloud.com host carry the same number', () => {
    expect(reqIdFrom('https://careers.ti.com/en/sites/CX/job/25016392', 'oracle:CX:25016392')).toBe('25016392');
    expect(reqIdFrom('https://edbz.fa.us2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX/job/25016392', 'simplify:x')).toBe('25016392');
  });
});

describe('merge rules', () => {
  it('the AMD pair: both applied → one applied job, the feed row kept, final/best fit, longest description, notes merged', () => {
    const db = mem();
    addJob(db, 'jibe:careers.amd.com:92342', { url: 'https://careers.amd.com/jobs/92342?lang=en-us', status: 'applied', applied_date: '2026-10-01', fit_score: 74, rank_stage: 'final', description: 'x'.repeat(900), notes: 'Same req as the copy', application_dir: 'applications/AMD_ML_2026-10-09' });
    addJob(db, 'simplify:daf764cc', { url: 'https://careers.amd.com/jobs/92342?icims=1', status: 'applied', applied_date: '2026-10-02', fit_score: 88, rank_stage: 'final', description: 'y'.repeat(400), notes: 'Duplicate feed record', first_seen: '2026-09-28T00:00:00.000Z' });
    db.prepare("INSERT INTO events(at, entity, entity_id, kind) VALUES (?, 'job', 'simplify:daf764cc', 'status')").run(T0);
    db.prepare("INSERT INTO outreach(type, job_id, body, created_at, updated_at) VALUES ('referral', 'simplify:daf764cc', 'hi', ?, ?)").run(T0, T0);
    const r = dedupeJobs(db, { now: '2026-10-18T00:00:00.000Z' });
    expect(r.groups).toHaveLength(1);
    expect(r.groups[0]).toMatchObject({ kept: 'jibe:careers.amd.com:92342', removed: ['simplify:daf764cc'], reason: 'same URL', status: 'applied' });
    expect(job(db, 'simplify:daf764cc')).toBeUndefined();
    expect(job(db, 'jibe:careers.amd.com:92342')).toMatchObject({
      status: 'applied', applied_date: '2026-10-01', fit_score: 88, rank_stage: 'final', description: 'x'.repeat(900),
      notes: 'Same req as the copy\nDuplicate feed record', first_seen: '2026-09-28T00:00:00.000Z', application_dir: 'applications/AMD_ML_2026-10-09',
      canonical_url: 'https://careers.amd.com/jobs/92342', updated_at: '2026-10-18T00:00:00.000Z',
    });
    expect(db.prepare("SELECT entity_id FROM events WHERE kind = 'status'").get()).toEqual({ entity_id: 'jibe:careers.amd.com:92342' });
    expect(db.prepare('SELECT job_id FROM outreach').get()).toEqual({ job_id: 'jibe:careers.amd.com:92342' });
    expect(db.prepare('SELECT job_id, reason FROM job_aliases WHERE alias_id = ?').get('simplify:daf764cc')).toEqual({ job_id: 'jibe:careers.amd.com:92342', reason: 'same URL' });
    expect(db.prepare("SELECT count(*) AS n FROM events WHERE kind = 'duplicate_merged'").get()).toEqual({ n: 1 });
    expect(dedupeJobs(db).groups).toHaveLength(0); // idempotent
  });

  it('status precedence: interview > applied > referral > later > ranked/new; an applied copy is never lost', () => {
    const order = ['new', 'ranked', 'later', 'apply_referral', 'applied', 'interview'];
    for (let i = 1; i < order.length; i++) {
      const rows = [
        { id: 'feed', company: 'X', status: order[i - 1], first_seen: T0 },
        { id: 'simplify:c', company: 'X', status: order[i], first_seen: T0, decision_at: '2026-10-05T00:00:00.000Z' },
      ];
      const m = mergedFields(rows, T0);
      expect(m.keep.id).toBe('feed');
      expect(m.set.status).toBe(order[i]);
      expect(m.set.decision_at).toBe('2026-10-05T00:00:00.000Z');
    }
  });

  it('a final score beats a higher quick score; a SimplifyJobs row loses to the feed row even with more progress', () => {
    const m = mergedFields([
      { id: 'simplify:a', company: 'X', status: 'apply_referral', first_seen: T0, fit_score: 90, rank_stage: 'quick' },
      { id: 'wd:x:R1', company: 'X', status: 'ranked', first_seen: '2026-10-05T00:00:00.000Z', fit_score: 60, rank_stage: 'final', fit_reason: 'checked' },
    ], T0);
    expect(m.keep.id).toBe('wd:x:R1');
    expect(m.set).toMatchObject({ status: 'apply_referral', first_seen: T0 });
    expect(m.set.fit_score).toBeUndefined(); // the kept row's own final score stays
  });

  it('same requisition at the same company merges; the same number at another company, or same title with another URL, does not', () => {
    const db = mem();
    addJob(db, 'oracle:CX:25016392', { company: 'Texas Instruments', url: 'https://careers.ti.com/en/sites/CX/job/25016392' });
    addJob(db, 'simplify:ti', { company: 'Texas Instruments', url: 'https://edbz.fa.us2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX/job/25016392' });
    addJob(db, 'simplify:other', { company: 'Nokia', url: 'https://fa-x.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX/job/25016392' });
    addJob(db, 'wd:micron:JR111814', { company: 'Micron', title: 'Intern - DRAM Design', url: 'https://micron.wd1.myworkdayjobs.com/External/job/Boise/Intern_JR111814' });
    addJob(db, 'wd:micron:JR111821', { company: 'Micron', title: 'Intern - DRAM Design', url: 'https://micron.wd1.myworkdayjobs.com/External/job/Boise/Intern_JR111821' });
    const r = dedupeJobs(db);
    expect(r.groups.map((g) => [g.kept, g.removed, g.reason])).toEqual([['oracle:CX:25016392', ['simplify:ti'], 'same requisition number']]);
    expect(job(db, 'simplify:other')).toBeTruthy();
    expect(job(db, 'wd:micron:JR111821')).toBeTruthy();
  });

  it('--dry changes nothing', () => {
    const db = mem();
    addJob(db, 'jibe:1', { url: 'https://careers.amd.com/jobs/1?lang=en-us' });
    addJob(db, 'simplify:1', { url: 'https://careers.amd.com/jobs/1?icims=1' });
    expect(dedupeJobs(db, { dry: true }).removed).toBe(1);
    expect(db.prepare('SELECT count(*) AS n FROM jobs').get()).toEqual({ n: 2 });
    expect(db.prepare('SELECT count(*) AS n FROM job_aliases').get()).toEqual({ n: 0 });
  });

  it('the importer maps a re-import (same id, or a new copy with the same canonical URL) onto the kept job', () => {
    const db = mem();
    addJob(db, 'jibe:2', { url: 'https://careers.amd.com/jobs/2?lang=en-us' });
    addJob(db, 'simplify:2', { url: 'https://careers.amd.com/jobs/2?icims=1', status: 'applied' });
    dedupeJobs(db);
    const n = upsertJobs(db, [
      { id: 'simplify:2', company: 'AMD', title: 'Intern', url: 'https://careers.amd.com/jobs/2?icims=1', description: 'again' },
      { id: 'simplify:3', company: 'AMD', title: 'Intern', url: 'https://careers.amd.com/jobs/2?utm_source=Simplify&icims=1' },
    ]);
    expect(n).toBe(0);
    expect(db.prepare('SELECT id, status FROM jobs').all()).toEqual([{ id: 'jibe:2', status: 'applied' }]);
    expect(db.prepare("SELECT job_id FROM job_aliases WHERE alias_id = 'simplify:3'").get()).toEqual({ job_id: 'jibe:2' });
  });
});

describe('another PC converges', () => {
  const fakeD1 = (db: DB): D1 => ({
    async query(sqls: string[]) { return sqls.map((s) => db.prepare(s).all() as Record<string, unknown>[]); },
    async exec(sql: string) { db.exec(sql); },
  });

  it('applyAliases merges a local duplicate into the row the other PC kept', () => {
    const db = mem();
    addJob(db, 'simplify:9', { url: 'https://careers.amd.com/jobs/9?icims=1', status: 'applied' });
    addJob(db, 'jibe:9', { url: 'https://careers.amd.com/jobs/9?lang=en-us' });
    db.prepare("INSERT INTO job_aliases(alias_id, job_id, reason, at) VALUES ('simplify:9', 'jibe:9', 'same URL', ?)").run(T0);
    expect(applyAliases(db)).toEqual([{ alias: 'simplify:9', into: 'jibe:9' }]);
    expect(db.prepare('SELECT id, status FROM jobs').all()).toEqual([{ id: 'jibe:9', status: 'applied' }]);
  });

  it('home merges → D1 deletes the copy; the work PC never pushes it back and ends with the same rows', async () => {
    const home = mem(); const work = mem(); const cloud = mem(); const d1 = fakeD1(cloud);
    cloud.exec(MIG('0017_run_requests.sql') + MIG('0018_machines.sql'));
    addJob(home, 'jibe:7', { url: 'https://careers.amd.com/jobs/7?lang=en-us' });
    addJob(home, 'simplify:7', { url: 'https://careers.amd.com/jobs/7?icims=1', status: 'applied', applied_date: '2026-10-02' });
    await cloudSync(home, d1, { machine: { id: 'home', name: 'Home PC' } });
    await cloudSync(work, d1, { machine: { id: 'work', name: 'Work PC' } }); // the second PC starts from the cloud
    expect(work.prepare('SELECT count(*) AS n FROM jobs').get()).toEqual({ n: 2 });
    dedupeJobs(home, { now: '2026-10-18T00:00:00.000Z' });
    await cloudSync(home, d1);
    expect(cloud.prepare('SELECT id, status FROM jobs').all()).toEqual([{ id: 'jibe:7', status: 'applied' }]);
    const w1 = await cloudSync(work, d1); // brings the alias, merges locally
    expect(w1.jobs.pushedNew).toBe(0);
    await cloudSync(work, d1);
    expect(cloud.prepare('SELECT id, status FROM jobs').all()).toEqual([{ id: 'jibe:7', status: 'applied' }]);
    expect(work.prepare('SELECT id, status, applied_date FROM jobs').all()).toEqual([{ id: 'jibe:7', status: 'applied', applied_date: '2026-10-02' }]);
    expect((await cloudSync(work, d1)).changes).toBe(0);
    await cloudSync(home, d1); // the work PC's merge event comes down
    expect((await cloudSync(home, d1)).changes).toBe(0);
    expect(home.prepare('SELECT id FROM jobs').all()).toEqual([{ id: 'jibe:7' }]);
  });
});

