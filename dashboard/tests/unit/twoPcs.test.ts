// Two PCs (home and work), each with its own local database, syncing with one cloud (the hub). The cloud is a fake D1:
// an in-memory SQLite database with the dashboard schema plus the site migrations for machines / the PC queue.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ID_RANGE, nextId, openDb, type DB } from '../../server/db';
import { cloudSync, type D1 } from '../../server/cloudSync';
import { addContact, addEvent, setStatus, updateContact } from '../../server/repo';
import { insertRun, updateRun } from '../../server/runs/store';
import { otherBusyMessage, RunRequestPoller, type RequestActions } from '../../server/runRequests';

const MIG = (n: string) => fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../fixtures/site-migrations', n), 'utf8');
const HOME = { id: 'home', name: 'Home PC' };
const WORK = { id: 'work', name: 'Work PC' };

function cloud(): { db: DB; d1: D1 } {
  const db = openDb(':memory:');
  db.exec(MIG('0017_run_requests.sql') + MIG('0018_machines.sql'));
  return { db, d1: { async query(sqls) { return sqls.map((s) => db.prepare(s).all() as Record<string, unknown>[]); }, async exec(sql) { db.exec(sql); } } };
}
let clock = Date.parse('2026-10-17T10:00:00Z');
const now = () => new Date(clock += 1000).toISOString();
function addJob(db: DB, id: string, f: Record<string, unknown> = {}) {
  const row = { id, company: 'NVIDIA', title: `Intern ${id}`, status: 'ranked', fit_score: 50, description: `About ${id}`, updated_at: '2026-10-01T00:00:00.000Z', ...f };
  db.prepare(`INSERT INTO jobs(${Object.keys(row).join(', ')}) VALUES (${Object.keys(row).map(() => '?').join(', ')})`).run(...Object.values(row));
}
const ids = (db: DB, t: string) => (db.prepare(`SELECT id FROM ${t} ORDER BY id`).all() as { id: number }[]).map((r) => r.id);
const count = (db: DB, t: string) => (db.prepare(`SELECT count(*) AS n FROM ${t}`).get() as { n: number }).n;

/** The home PC with some history, already synced once (the state before the work PC exists). */
async function homeWithHistory() {
  const c = cloud();
  const home = openDb(':memory:');
  addJob(home, 'a'); addJob(home, 'b'); addJob(home, 'c', { status: 'new' });
  home.prepare("INSERT INTO imports(file, imported_at, rows) VALUES ('jobs/inbox/2026-10-01.jsonl', '2026-10-01T00:00:00Z', 3)").run();
  home.prepare("INSERT INTO job_aliases(alias_id, job_id, reason, at) VALUES ('a-old', 'a', 'same url', '2026-10-01T00:00:00Z')").run();
  home.prepare("INSERT INTO manual_checks(company, checked_at, result, found, added) VALUES ('Meta', '2026-10-09T20:49:00Z', 'ok', 9, 1)").run();
  const r = insertRun(home, 'process-new-jobs', {});
  updateRun(home, r.id, { status: 'succeeded', finished_at: '2026-10-09T21:00:00Z', summary: 'Ranked 3 new jobs.' });
  addContact(home, { name: 'Ada Researcher', company: 'NVIDIA', relationship: 'researcher' });
  setStatus(home, 'a', 'applied');
  const first = await cloudSync(home, c.d1, { machine: HOME, now });
  expect(first.machineIdx).toBe(0);
  return { ...c, home };
}

describe('two PCs, one cloud', () => {
  it('a new PC starts from the cloud: everything comes down (jobs with descriptions, events, runs, ledger, checks, contacts)', async () => {
    const { db: cl, d1, home } = await homeWithHistory();
    const work = openDb(':memory:');
    addJob(work, 'stale', { status: 'new' }); // e.g. imported from an old tracker.csv before the first sync
    const r = await cloudSync(work, d1, { machine: WORK, now });
    expect(r).toMatchObject({ machineIdx: 1, pulledAll: true });
    expect(ids(work, 'jobs')).toEqual(ids(home, 'jobs'));
    expect(work.prepare("SELECT status, description FROM jobs WHERE id = 'a'").get()).toEqual({ status: 'applied', description: 'About a' });
    expect(ids(work, 'runs')).toEqual(ids(home, 'runs'));
    expect(ids(work, 'contacts')).toEqual(ids(home, 'contacts'));
    expect(count(work, 'imports')).toBe(1);
    expect(count(work, 'job_aliases')).toBe(1);
    expect(work.prepare("SELECT checked_at FROM manual_checks WHERE company = 'Meta'").get()).toEqual({ checked_at: '2026-10-09T20:49:00Z' });
    expect(count(work, 'events')).toBe(count(home, 'events'));
    expect(cl.prepare('SELECT id, idx FROM machines ORDER BY idx').all()).toEqual([{ id: 'home', idx: 0 }, { id: 'work', idx: 1 }]);
    // the stale local job is gone (local data was replaced), nothing stale was pushed
    expect(work.prepare("SELECT 1 FROM jobs WHERE id = 'stale'").get()).toBeUndefined();
    expect(cl.prepare("SELECT 1 FROM jobs WHERE id = 'stale'").get()).toBeUndefined();
  });

  it('both PCs make changes; after syncing both have the same rows, ids never collide, newer wins', async () => {
    const { db: cl, d1, home } = await homeWithHistory();
    const work = openDb(':memory:');
    await cloudSync(work, d1, { machine: WORK, now });

    // work: a run, a contact, a status change, a fresher manual check; home: a run, a contact edit, an event
    const wr = insertRun(work, 'process-new-jobs', {});
    updateRun(work, wr.id, { status: 'succeeded', finished_at: now(), summary: 'Ranked 1 new job.' });
    expect(wr.id).toBe(ID_RANGE + 1);
    const wc = addContact(work, { name: 'Bo Engineer', company: 'AMD', relationship: 'researcher' });
    expect(wc.id).toBe(ID_RANGE + 1);
    setStatus(work, 'c', 'skip');
    work.prepare("UPDATE manual_checks SET checked_at = '2026-10-17T09:00:00Z', found = 11 WHERE company = 'Meta'").run();
    const hr = insertRun(home, 'weekly-review', {});
    expect(hr.id).toBeLessThan(ID_RANGE);
    updateContact(home, 1, { notes: 'met at DAC' });
    addEvent(home, 'job', 'b', 'note', { text: 'from home' });

    for (let i = 0; i < 2; i++) { await cloudSync(work, d1, { machine: WORK, now }); await cloudSync(home, d1, { machine: HOME, now }); }

    for (const t of ['runs', 'contacts']) {
      expect(ids(home, t)).toEqual(ids(work, t));
      expect(ids(cl, t)).toEqual(ids(home, t));
      expect(new Set(ids(home, t)).size).toBe(ids(home, t).length);
    }
    expect(ids(home, 'runs')).toEqual([1, hr.id, ID_RANGE + 1]);
    expect(home.prepare("SELECT status FROM jobs WHERE id = 'c'").get()).toEqual({ status: 'skip' });
    expect(home.prepare("SELECT found FROM manual_checks WHERE company = 'Meta'").get()).toEqual({ found: 11 });
    expect(work.prepare('SELECT notes FROM contacts WHERE id = 1').get()).toEqual({ notes: 'met at DAC' });
    // events: each PC has its own plus the other's, once
    const kinds = (db: DB) => (db.prepare("SELECT kind, entity_id FROM events WHERE kind IN ('status','note') ORDER BY kind, entity_id").all());
    expect(kinds(home)).toEqual(kinds(work));
    expect(count(home, 'events')).toBe(count(work, 'events'));
    // a further round changes nothing
    const again = await cloudSync(work, d1, { machine: WORK, now });
    expect(again.changes).toBe(0);
    // next ids stay in each PC's range even after copying the other's rows
    expect(nextId(home, 'runs')).toBe(hr.id + 1);
    expect(nextId(work, 'runs')).toBe(ID_RANGE + 2);
  });

  it("another PC's run is never started, stopped or recovered here", async () => {
    const { d1, home } = await homeWithHistory();
    const work = openDb(':memory:');
    await cloudSync(work, d1, { machine: WORK, now });
    insertRun(work, 'process-new-jobs', {}); // queued on the work PC
    await cloudSync(work, d1, { machine: WORK, now });
    await cloudSync(home, d1, { machine: HOME, now });
    const { activeRuns } = await import('../../server/runs/store');
    expect(home.prepare('SELECT status FROM runs WHERE id = ?').get(ID_RANGE + 1)).toEqual({ status: 'queued' });
    expect(activeRuns(home)).toEqual([]);
    expect(activeRuns(work).map((r) => r.id)).toEqual([ID_RANGE + 1]);
  });

  it('a database copied from the other PC refuses to sync', async () => {
    const { d1, home } = await homeWithHistory();
    await expect(cloudSync(home, d1, { machine: WORK, now })).rejects.toThrow(/--pull-all/);
  });
});

describe('two PCs and the website queue', () => {
  const actions = (owns: number[] = []): RequestActions & { started: string[] } => {
    const a = {
      started: [] as string[], idle: () => true, currentRun: () => null, ownsRun: (id: number) => owns.includes(id),
      startRun: (task: string) => { a.started.push(task); return { runId: 1, deduped: false }; },
      getRun: () => ({ id: 1, status: 'running' }), runRows: () => [], cancelRun: (id: number) => `Run #${id}: stopping`,
      gitSync: async () => '', fetchDescription: async () => '', paperEmails: async () => '', cloudSync: async () => true,
    };
    return a;
  };
  const q = (db: DB, kind: string, task: string | null, params = {}) => Number(db.prepare("INSERT INTO run_requests(kind, task, params_json, requested_at, status, updated_at) VALUES (?,?,?,?, 'queued', ?)")
    .run(kind, task, JSON.stringify(params), now(), now()).lastInsertRowid);
  const opts = (machine: { id: string; name: string }) => ({ machine, version: 't', checkOnline: false, progressEveryMs: 60_000, now });

  it('one request, two PCs: claimed once, claimed_by recorded; heartbeats per PC', async () => {
    const { db, d1 } = cloud();
    const h = actions(); const w = actions();
    const id = q(db, 'run', 'process-new-jobs');
    await Promise.all([new RunRequestPoller(d1, h, opts(HOME)).tick(), new RunRequestPoller(d1, w, opts(WORK)).tick()]);
    expect(h.started.length + w.started.length).toBe(1);
    expect(['home', 'work']).toContain((db.prepare('SELECT claimed_by FROM run_requests WHERE id = ?').get(id) as { claimed_by: string }).claimed_by);
    expect(db.prepare('SELECT machine, name FROM pc_heartbeat ORDER BY machine').all()).toEqual([{ machine: 'home', name: 'Home PC' }, { machine: 'work', name: 'Work PC' }]);
  });

  it("while the other PC runs Process new jobs, this PC leaves the next one queued (stale after 2 h)", async () => {
    const { db, d1 } = cloud();
    const t = new Date(clock).toISOString();
    db.prepare("INSERT INTO pc_heartbeat(machine, name, at, busy, current_run, current_task) VALUES ('work', 'Work PC', ?, 1, 1000000005, 'process-new-jobs')").run(t);
    const h = actions();
    const p = new RunRequestPoller(d1, h, opts(HOME));
    const id = q(db, 'run', 'process-new-jobs');
    const weekly = q(db, 'run', 'weekly-review');
    await p.tick();
    expect(db.prepare('SELECT status FROM run_requests WHERE id = ?').get(id)).toEqual({ status: 'queued' });
    expect(h.started).toEqual(['weekly-review']); // not a job-writing task: fine
    expect(db.prepare('SELECT status FROM run_requests WHERE id = ?').get(weekly)).toEqual({ status: 'started' });
    expect(p.blockedBy()).toMatch(/Work PC is running process new jobs \(run #1000000005\)/);
    expect(otherBusyMessage([{ machine: 'work', name: 'Work PC', at: '2026-10-17T00:00:00Z', current_run: 5, current_task: 'process-new-jobs' }], [], Date.parse('2026-10-17T01:00:00Z'))).toBeNull();
    expect(otherBusyMessage([], [{ id: 3, task: 'process-new-jobs', claimed_by: 'work', name: 'Work PC', updated_at: '2026-10-17T00:00:00Z' }], Date.parse('2026-10-17T01:00:00Z'))).toMatch(/Work PC is running/);
    expect(otherBusyMessage([], [{ id: 3, task: 'process-new-jobs', claimed_by: 'work', updated_at: '2026-10-17T00:00:00Z' }], Date.parse('2026-10-17T03:00:00Z'))).toBeNull();
  });

  it('a stop request goes to the PC that runs the run', async () => {
    const { db, d1 } = cloud();
    const h = actions([1]); const w = actions([]);
    const id = q(db, 'cancel-run', null, { runId: 1 });
    await new RunRequestPoller(d1, w, opts(WORK)).tick();
    expect(db.prepare('SELECT status FROM run_requests WHERE id = ?').get(id)).toEqual({ status: 'queued' });
    await new RunRequestPoller(d1, h, opts(HOME)).tick();
    expect(db.prepare('SELECT status, claimed_by FROM run_requests WHERE id = ?').get(id)).toEqual({ status: 'done', claimed_by: 'home' });
  });
});
