// Two-way cloud sync (server/cloudSync.ts) against a fake D1: a second in-memory SQLite database with the same schema.
import { describe, expect, it } from 'vitest';
import { openDb, type DB } from '../../server/db';
import { cloudSync, mergeCompanyNotes, mergeJob, type D1 } from '../../server/cloudSync';

function fakeD1(db: DB): D1 & { calls: number } {
  const d = {
    calls: 0,
    async query(sqls: string[]) { d.calls++; return sqls.map((s) => db.prepare(s).all() as Record<string, unknown>[]); },
    async exec(sql: string) { d.calls++; db.exec(sql); },
  };
  return d;
}

const T0 = '2026-10-01T00:00:00.000Z';
function addJob(db: DB, id: string, fields: Record<string, unknown> = {}) {
  const row = { id, company: 'NVIDIA', title: `Intern ${id}`, status: 'ranked', fit_score: 50, notes: null, updated_at: T0, ...fields };
  const keys = Object.keys(row);
  db.prepare(`INSERT INTO jobs(${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`).run(...Object.values(row));
}
const job = (db: DB, id: string) => db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as Record<string, unknown> | undefined;
const set = (db: DB, id: string, f: Record<string, unknown>) =>
  db.prepare(`UPDATE jobs SET ${Object.keys(f).map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).run(...Object.values(f), id);

function pair() {
  const local = openDb(':memory:'); const cloudDb = openDb(':memory:');
  return { local, cloudDb, d1: fakeD1(cloudDb) };
}
async function synced(...ids: string[]) {
  const p = pair();
  for (const id of ids) { addJob(p.local, id); addJob(p.cloudDb, id); }
  const first = await cloudSync(p.local, p.d1);
  expect(first.firstRun).toBe(true);
  return p;
}

describe('cloud sync: jobs (three-way merge)', () => {
  it('pushes a change made only locally', async () => {
    const { local, cloudDb, d1 } = await synced('a', 'b');
    set(local, 'a', { status: 'applied', applied_date: '2026-10-02', updated_at: '2026-10-02T00:00:00.000Z' });
    const r = await cloudSync(local, d1);
    expect(r.jobs.pushedUpdates).toBe(1);
    expect(r.jobs.pulledUpdates).toBe(0);
    expect(job(cloudDb, 'a')).toMatchObject({ status: 'applied', applied_date: '2026-10-02', updated_at: '2026-10-02T00:00:00.000Z' });
    expect(job(cloudDb, 'b')?.status).toBe('ranked');
  });

  it('pulls a change made only on the website', async () => {
    const { local, cloudDb, d1 } = await synced('a');
    set(cloudDb, 'a', { notes: 'from the phone', updated_at: '2026-10-03T00:00:00.000Z' });
    const r = await cloudSync(local, d1);
    expect(r.jobs.pulledUpdates).toBe(1);
    expect(r.localChanges).toBe(1);
    expect(job(local, 'a')).toMatchObject({ notes: 'from the phone', updated_at: '2026-10-03T00:00:00.000Z' });
  });

  it('merges different fields changed on both sides', async () => {
    const { local, cloudDb, d1 } = await synced('a');
    set(local, 'a', { fit_score: 80, updated_at: '2026-10-02T00:00:00.000Z' });
    set(cloudDb, 'a', { status: 'skip', updated_at: '2026-10-03T00:00:00.000Z' });
    const r = await cloudSync(local, d1);
    expect(r.jobs.conflicts).toBe(0);
    for (const db of [local, cloudDb]) expect(job(db, 'a')).toMatchObject({ fit_score: 80, status: 'skip', updated_at: '2026-10-03T00:00:00.000Z' });
  });

  it('the same field changed on both sides: the newer updated_at wins', async () => {
    const { local, cloudDb, d1 } = await synced('a', 'b');
    set(local, 'a', { status: 'applied', updated_at: '2026-10-02T00:00:00.000Z' });
    set(cloudDb, 'a', { status: 'skip', updated_at: '2026-10-03T00:00:00.000Z' });   // cloud newer
    set(local, 'b', { status: 'applied', updated_at: '2026-10-05T00:00:00.000Z' });   // local newer
    set(cloudDb, 'b', { status: 'later', updated_at: '2026-10-04T00:00:00.000Z' });
    const r = await cloudSync(local, d1);
    expect(r.jobs.conflicts).toBe(2);
    for (const db of [local, cloudDb]) {
      expect(job(db, 'a')?.status).toBe('skip');
      expect(job(db, 'b')?.status).toBe('applied');
    }
  });

  it('a website edit made while the sync runs is not overwritten, and is merged next time', async () => {
    const { local, cloudDb, d1 } = await synced('a');
    set(local, 'a', { fit_score: 99, updated_at: '2026-10-02T00:00:00.000Z' });
    const racy: D1 = {
      query: d1.query,
      async exec(sql) { set(cloudDb, 'a', { notes: 'typed on the phone', updated_at: '2026-10-02T00:00:01.000Z' }); await d1.exec(sql); },
    };
    const r = await cloudSync(local, racy);
    expect(r.jobs.raced).toBe(1);
    expect(job(cloudDb, 'a')).toMatchObject({ notes: 'typed on the phone', fit_score: 50 });
    await cloudSync(local, d1);
    for (const db of [local, cloudDb]) expect(job(db, 'a')).toMatchObject({ notes: 'typed on the phone', fit_score: 99 });
  });

  it('a second sync is a no-op', async () => {
    const { local, cloudDb, d1 } = await synced('a');
    set(cloudDb, 'a', { notes: 'x', updated_at: '2026-10-03T00:00:00.000Z' });
    await cloudSync(local, d1);
    const again = await cloudSync(local, d1);
    expect(again.changes).toBe(0);
    expect(again.jobs.downloaded).toBe(0);
  });

  it('copies new jobs each way and deletes cloud copies of jobs merged locally as duplicates', async () => {
    const { local, cloudDb, d1 } = await synced('a', 'dup');
    addJob(local, 'new-local');
    addJob(cloudDb, 'new-cloud', { status: 'later' });
    local.prepare('DELETE FROM jobs WHERE id = ?').run('dup');
    local.prepare("INSERT INTO job_aliases(alias_id, job_id, reason, at) VALUES ('dup', 'a', 'same url', ?)").run(T0);
    const r = await cloudSync(local, d1);
    expect(r.jobs).toMatchObject({ pushedNew: 1, pulledNew: 1, deletedInCloud: 1 });
    expect(job(cloudDb, 'new-local')).toBeTruthy();
    expect(job(local, 'new-cloud')?.status).toBe('later');
    expect(job(cloudDb, 'dup')).toBeUndefined();
    expect(cloudDb.prepare("SELECT job_id FROM job_aliases WHERE alias_id = 'dup'").get()).toEqual({ job_id: 'a' });
  });

  it('first sync: local wins, except user fields where the cloud row is newer (listed in the report)', async () => {
    const { local, cloudDb, d1 } = pair();
    addJob(local, 'a', { status: 'applied', fit_score: 70, updated_at: '2026-10-05T00:00:00.000Z' });
    addJob(cloudDb, 'a', { status: 'ranked', fit_score: 10, updated_at: '2026-10-01T00:00:00.000Z' }); // cloud older: local wins
    addJob(local, 'b', { status: 'ranked', fit_score: 70, notes: null, updated_at: '2026-10-01T00:00:00.000Z' });
    addJob(cloudDb, 'b', { status: 'interview', fit_score: 10, notes: 'phone screen', updated_at: '2026-10-06T00:00:00.000Z' }); // cloud newer
    const r = await cloudSync(local, d1);
    expect(r.firstRun).toBe(true);
    for (const db of [local, cloudDb]) {
      expect(job(db, 'a')).toMatchObject({ status: 'applied', fit_score: 70 });
      // user fields from the newer cloud row; machinery (fit_score) stays local
      expect(job(db, 'b')).toMatchObject({ status: 'interview', notes: 'phone screen', fit_score: 70, updated_at: '2026-10-06T00:00:00.000Z' });
    }
    expect(r.cloudWins.map((w) => `${w.id}.${w.field}`).sort()).toEqual(['b.notes', 'b.status']);
    expect((await cloudSync(local, d1)).changes).toBe(0);
  });

  it('dry run counts but writes nothing', async () => {
    const { local, cloudDb, d1 } = pair();
    addJob(local, 'a');
    const r = await cloudSync(local, d1, { dry: true });
    expect(r.jobs.pushedNew).toBe(1);
    expect(job(cloudDb, 'a')).toBeUndefined();
    expect(local.prepare('SELECT count(*) n FROM cloud_sync_base').get()).toEqual({ n: 0 });
  });
});

describe('cloud sync: company notes, events, one-way tables', () => {
  it('company notes: newer wins both ways', async () => {
    const { local, cloudDb, d1 } = pair();
    const note = (db: DB, key: string, text: string, at: string) => db.prepare('INSERT OR REPLACE INTO company_notes(company_key, company, note, updated_at) VALUES (?,?,?,?)').run(key, key, text, at);
    note(local, 'nvidia', 'local newer', '2026-10-05T00:00:00.000Z'); note(cloudDb, 'nvidia', 'cloud older', '2026-10-01T00:00:00.000Z');
    note(local, 'amd', 'local older', '2026-10-01T00:00:00.000Z'); note(cloudDb, 'amd', 'cloud newer', '2026-10-05T00:00:00.000Z');
    note(local, 'intel', 'only local', T0); note(cloudDb, 'micron', 'only cloud', T0);
    const r = await cloudSync(local, d1);
    expect(r.companyNotes).toEqual({ pushed: 2, pulled: 2 });
    for (const db of [local, cloudDb]) {
      const m = Object.fromEntries((db.prepare('SELECT company_key, note FROM company_notes').all() as { company_key: string; note: string }[]).map((x) => [x.company_key, x.note]));
      expect(m).toEqual({ nvidia: 'local newer', amd: 'cloud newer', intel: 'only local', micron: 'only cloud' });
    }
  });

  it('mergeCompanyNotes ties go to local', () => {
    const r = mergeCompanyNotes([{ company_key: 'x', company: 'X', note: 'L', updated_at: T0 }], [{ company_key: 'x', company: 'X', note: 'C', updated_at: T0 }]);
    expect(r.toCloud).toHaveLength(1); expect(r.toLocal).toHaveLength(0);
  });

  it('events are copied once each way with new ids, never bounced back; undo is passed on', async () => {
    const { local, cloudDb, d1 } = await synced('a');
    const ev = (db: DB, kind: string) => Number(db.prepare("INSERT INTO events(at, entity, entity_id, kind, detail_json) VALUES (?, 'job', 'a', ?, '{\"from\":\"ranked\"}')").run(new Date().toISOString(), kind).lastInsertRowid);
    const l1 = ev(local, 'status'); ev(cloudDb, 'note'); ev(cloudDb, 'status');
    const r = await cloudSync(local, d1);
    expect(r.events).toMatchObject({ pushed: 1, pulled: 2 });
    const kinds = (db: DB) => (db.prepare("SELECT kind FROM events WHERE entity = 'job' ORDER BY id").all() as { kind: string }[]).map((x) => x.kind).sort();
    expect(kinds(local)).toEqual(['note', 'status', 'status']);
    expect(kinds(cloudDb)).toEqual(['note', 'status', 'status']);
    expect((await cloudSync(local, d1)).events).toMatchObject({ pushed: 0, pulled: 0 });
    // undo locally → the cloud copy is marked undone too
    local.prepare('UPDATE events SET undone_at = ? WHERE id = ?').run(new Date().toISOString(), l1);
    const u = await cloudSync(local, d1);
    expect(u.events.undonePushed).toBe(1);
    expect(cloudDb.prepare(`SELECT undone_at FROM events WHERE detail_json LIKE '%"sync_src":"local:${l1}"%'`).get()).toEqual({ undone_at: expect.any(String) });
  });

  it('one-way tables are upserted only when they changed', async () => {
    const { local, cloudDb, d1 } = pair();
    local.prepare("INSERT INTO manual_checks(company, checked_at, result, found, added) VALUES ('Meta', ?, 'ok', 9, 1)").run(T0);
    local.prepare("INSERT INTO runs(id, task, status, created_at) VALUES (1, 'process-new-jobs', 'succeeded', ?)").run(T0);
    expect((await cloudSync(local, d1)).oneWay).toMatchObject({ manual_checks: 1, runs: 1 });
    expect((await cloudSync(local, d1)).oneWay).toEqual({});
    local.prepare("UPDATE manual_checks SET checked_at = '2026-10-09T00:00:00.000Z'").run();
    expect((await cloudSync(local, d1)).oneWay).toEqual({ manual_checks: 1 });
    expect(cloudDb.prepare('SELECT checked_at FROM manual_checks').get()).toEqual({ checked_at: '2026-10-09T00:00:00.000Z' });
  });
});

describe('mergeJob', () => {
  const cols = ['id', 'status', 'notes', 'updated_at'];
  it('cloud unchanged (not downloaded): only the fields that differ from the base go up', () => {
    const base = { colsKey: 'k', hashes: {} as Record<string, string>, updated_at: T0 };
    const m = mergeJob(cols, { id: 'a', status: 'skip', notes: null, updated_at: '2026-10-02' }, null, base);
    expect(m.toCloud).toEqual(['status', 'notes', 'updated_at']); // empty base hashes: everything counts as changed
    expect(m.toLocal).toEqual([]);
  });
});
