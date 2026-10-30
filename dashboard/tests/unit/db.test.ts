import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { addDays, dailyBackup, localDate, migrate, openDb, SCHEMA_VERSION } from '../../server/db';

const dirs: string[] = [];
const tmp = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'jw-db-')); dirs.push(d); return d; };
afterEach(() => { for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true }); });

describe('database', () => {
  it('creates the file, all tables, WAL mode and the schema version', () => {
    const file = path.join(tmp(), 'sub', 'jobwatcher.db');
    const db = openDb(file);
    expect(fs.existsSync(file)).toBe(true);
    const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[]).map((t) => t.name);
    expect(tables).toEqual(expect.arrayContaining(['jobs', 'contacts', 'outreach', 'events', 'imports', 'companies']));
    expect(db.pragma('journal_mode', { simple: true })).toBe('wal');
    expect(db.pragma('user_version', { simple: true })).toBe(SCHEMA_VERSION);
    db.close();
  });

  it('migrating twice is a no-op, and reopening keeps data', () => {
    const file = path.join(tmp(), 'j.db');
    const db = openDb(file);
    db.prepare("INSERT INTO jobs(id, title) VALUES ('x', 'T')").run();
    migrate(db);
    db.close();
    const again = openDb(file);
    expect(again.prepare('SELECT count(*) n FROM jobs').get()).toEqual({ n: 1 });
    again.close();
  });

  it('jobs default to status new and resume master', () => {
    const db = openDb(':memory:');
    db.prepare("INSERT INTO jobs(id, title) VALUES ('x', 'T')").run();
    expect(db.prepare('SELECT status, resume_version FROM jobs').get()).toEqual({ status: 'new', resume_version: 'master' });
  });
});

describe('v7 migration: simplified statuses (2026-10-17)', () => {
  it('prepared/apply_direct → applied (applied_date from the decision), rejected → applied and offer → interview with a note; closed stays; a trail event each', () => {
    const db = openDb(':memory:');
    // back to v6, with jobs in the old statuses
    db.exec('DROP TABLE company_notes; DROP TABLE paper_email_searches; ALTER TABLE companies DROP COLUMN you_check; ALTER TABLE companies DROP COLUMN you_check_reason;');
    db.pragma('user_version = 6');
    const add = db.prepare('INSERT INTO jobs(id, title, status, decision_at, applied_date, notes) VALUES (?,?,?,?,?,?)');
    add.run('p:1', 'Prepared', 'prepared', '2026-10-09T20:00:00.000Z', null, null);
    add.run('d:1', 'Direct', 'apply_direct', '2026-10-01T12:00:00.000Z', null, 'keep me');
    add.run('r:1', 'Rejected', 'rejected', '2026-09-20T12:00:00.000Z', '2026-09-21', null);
    add.run('o:1', 'Offer', 'offer', '2026-09-20T12:00:00.000Z', '2026-09-21', 'great');
    add.run('c:1', 'Closed', 'closed', null, null, null);
    add.run('a:1', 'Referral', 'apply_referral', '2026-10-01T12:00:00.000Z', null, null);
    migrate(db);
    expect(db.pragma('user_version', { simple: true })).toBe(SCHEMA_VERSION);
    const rows = Object.fromEntries((db.prepare('SELECT id, status, applied_date, notes FROM jobs').all() as { id: string; status: string; applied_date: string | null; notes: string | null }[]).map((r) => [r.id, r]));
    expect(rows['p:1']).toMatchObject({ status: 'applied', applied_date: '2026-10-09', notes: null });
    expect(rows['d:1']).toMatchObject({ status: 'applied', applied_date: '2026-10-01', notes: 'keep me' });
    expect(rows['r:1']).toMatchObject({ status: 'applied', applied_date: '2026-09-21' });
    expect(rows['r:1'].notes).toMatch(/Was "Rejected"/);
    expect(rows['o:1'].status).toBe('interview');
    expect(rows['o:1'].notes).toMatch(/^great\n\[\d{4}-\d{2}-\d{2}\] Was "Offer"/);
    expect(rows['c:1'].status).toBe('closed');
    expect(rows['a:1'].status).toBe('apply_referral');
    const trail = db.prepare("SELECT entity_id, json_extract(detail_json, '$.from') AS f, json_extract(detail_json, '$.to') AS t FROM events WHERE kind = 'status_migrated' ORDER BY entity_id").all();
    expect(trail).toEqual([
      { entity_id: 'd:1', f: 'apply_direct', t: 'applied' }, { entity_id: 'o:1', f: 'offer', t: 'interview' },
      { entity_id: 'p:1', f: 'prepared', t: 'applied' }, { entity_id: 'r:1', f: 'rejected', t: 'applied' },
    ]);
    const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]).map((t) => t.name);
    expect(tables).toEqual(expect.arrayContaining(['company_notes', 'paper_email_searches']));
  });
});

describe('daily backup', () => {
  it('makes one backup per day and keeps the newest N', async () => {
    const dir = tmp();
    const db = openDb(path.join(dir, 'j.db'));
    const backups = path.join(dir, 'backups');
    fs.mkdirSync(backups);
    for (let i = 1; i <= 16; i++) fs.writeFileSync(path.join(backups, `jobwatcher-2026-08-${String(i).padStart(2, '0')}.db`), '');
    const made = await dailyBackup(db, backups, 14, new Date(2026, 8, 30, 10));
    expect(made).toBe(path.join(backups, 'jobwatcher-2026-09-30.db'));
    expect(await dailyBackup(db, backups, 14, new Date(2026, 8, 30, 18))).toBeNull();
    const left = fs.readdirSync(backups).sort();
    expect(left).toHaveLength(14);
    expect(left.at(-1)).toBe('jobwatcher-2026-09-30.db');
    expect(left[0]).toBe('jobwatcher-2026-08-04.db');
    // the backup is a real, openable database
    const b = openDb(made!);
    expect(b.prepare("SELECT count(*) n FROM sqlite_master WHERE name='jobs'").get()).toEqual({ n: 1 });
    b.close(); db.close();
  });
});

describe('dates', () => {
  it('local dates and day arithmetic', () => {
    expect(localDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(addDays('2026-09-28', 7)).toBe('2026-10-05');
    expect(addDays('2026-12-28', 10)).toBe('2027-01-07');
  });
});
