// Git sync with REAL git: a temp bare "origin", an "upstream" clone (GitHub / the watcher) and the dashboard's clone.
// Ahead, behind, diverged, conflict (→ abort + warning), push failure, edited files never stashed, auto-commit after a run; no data loss.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openDb, type DB } from '../../server/db';
import { loadConfig } from '../../server/config';
import { realGit } from '../../server/git';
import { importLocal, sync, type Ctx } from '../../server/sync';
import { commitAfterRun, commitPaths, DASHBOARD_PATHS, WATCHER_PATHS } from '../../server/gitsync';
import { updateSettings } from '../../server/repo';
import { createApp } from '../../server/app';
import { COMPANIES_CSV, FAKE_CLAUDE, fakeScenario, inboxLine } from '../helpers';

const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const write = (root: string, rel: string, text: string) => { fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); fs.writeFileSync(path.join(root, rel), text); };
const read = (root: string, rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

let base: string; let origin: string; let up: string; let local: string; let db: DB; let ctx: Ctx;

function configure(dir: string) {
  git(dir, 'config', 'user.email', 'test@example.com'); git(dir, 'config', 'user.name', 'Test');
  git(dir, 'config', 'core.autocrlf', 'false'); git(dir, 'config', 'pull.rebase', 'false');
}

beforeEach(() => {
  base = fs.mkdtempSync(path.join(os.tmpdir(), 'jw-git-'));
  origin = path.join(base, 'origin.git'); up = path.join(base, 'upstream'); local = path.join(base, 'local');
  execFileSync('git', ['init', '--bare', '-b', 'main', origin]);
  execFileSync('git', ['clone', '-q', '-c', 'core.autocrlf=false', origin, up]); configure(up);
  git(up, 'checkout', '-q', '-b', 'main');
  write(up, '.gitignore', 'data/\n');
  write(up, 'targets/companies.csv', COMPANIES_CSV);
  write(up, 'targets/people.csv', 'name,company,team_or_lab,relationship,how_met,paper_or_topic,email_or_linkedin,email_source,status,date_contacted,follow_up_due,notes\n');
  write(up, 'jobs/inbox/README.md', 'inbox\n');
  write(up, 'jobs/inbox/2026-09-29_2200.jsonl', inboxLine({ id: 'gh:a:1', title: 'PIM Intern' }) + '\n');
  write(up, 'README.md', 'line one\nline two\n');
  git(up, 'add', '-A'); git(up, 'commit', '-q', '-m', 'seed'); git(up, 'push', '-q', '-u', 'origin', 'main');
  execFileSync('git', ['clone', '-q', '-c', 'core.autocrlf=false', origin, local]); configure(local);
  const cfg = loadConfig({ repoRoot: local, dataDir: path.join(local, 'data'), port: 0, claudeCommand: FAKE_CLAUDE });
  db = openDb(cfg.dbPath);
  ctx = { db, cfg, git: realGit };
  importLocal(ctx);
  // first sync commits the generated tracker.csv, so each test starts clean and even with origin
  return sync(ctx).then(() => { git(up, 'pull', '-q'); });
});

afterEach(() => { try { db.close(); } catch { /* closed */ } fs.rmSync(base, { recursive: true, force: true }); });

const head = (dir: string) => git(dir, 'rev-parse', 'HEAD');
const originHead = () => git(origin, 'rev-parse', 'main');
const status = (dir: string) => git(dir, 'status', '--porcelain');
const subjects = (dir: string, n = 5) => git(dir, 'log', `-${n}`, '--format=%s').split('\n');

describe('Sync (fetch + fast-forward / rebase / merge, never stash; then commit + push)', () => {
  it('the first sync committed tracker.csv as "Dashboard: sync" and pushed it', () => {
    expect(subjects(local, 2)).toEqual(['Dashboard: sync', 'seed']);
    expect(originHead()).toBe(head(local));
    expect(status(local)).toBe('');
  });

  it('an edited file (the Resume .docx, 2026-09-30) is never moved aside: the watcher\'s commit comes in, the edit stays put', async () => {
    write(local, 'Resume/Resume_2page.docx', 'my edited resume (open in Word)');
    git(local, 'add', 'Resume/Resume_2page.docx'); git(local, 'commit', '-q', '-m', 'resume'); git(local, 'push', '-q'); git(up, 'pull', '-q');
    write(local, 'Resume/Resume_2page.docx', 'newer unsaved edits');
    write(up, 'jobs/inbox/2026-09-30_1200.jsonl', inboxLine({ id: 'gh:a:3', title: 'HBM Intern' }) + '\n');
    git(up, 'add', '-A'); git(up, 'commit', '-q', '-m', 'watcher: 1 new'); git(up, 'push', '-q');
    const r = await sync(ctx);
    expect(r).toMatchObject({ pulled: true, warning: null, importedJobs: 1 });
    expect(read(local, 'Resume/Resume_2page.docx')).toBe('newer unsaved edits');
    expect(git(local, 'stash', 'list')).toBe(''); // nothing stashed
    expect(status(local)).toBe('M Resume/Resume_2page.docx');
  });

  it('GitHub changed a file you are editing: nothing is pulled, the edit is untouched, a clear warning; no stash', async () => {
    write(up, 'README.md', 'upstream line\n'); git(up, 'add', '-A'); git(up, 'commit', '-q', '-m', 'readme upstream'); git(up, 'push', '-q');
    write(local, 'README.md', 'my unsaved local line\n');
    const before = head(local);
    const r = await sync(ctx);
    expect(r.pulled).toBe(false);
    expect(r.warning).toMatch(/GitHub changed a file you are editing/);
    expect(read(local, 'README.md')).toBe('my unsaved local line\n');
    expect(git(local, 'stash', 'list')).toBe('');
    expect(git(local, 'log', '-1', '--format=%H', 'HEAD~0')).not.toBe(''); // still a sane repo
    expect(head(local) === before || subjects(local, 1)[0] === 'Dashboard: sync').toBe(true);
  });

  it('both sides moved and a file is edited: merged without touching the edit', async () => {
    write(local, 'notes/local.md', 'local commit\n'); git(local, 'add', '-A'); git(local, 'commit', '-q', '-m', 'local work');
    write(local, 'README.md', 'my unsaved local line\n');
    write(up, 'jobs/inbox/2026-09-30_1300.jsonl', inboxLine({ id: 'gh:a:4', title: 'ECC Intern' }) + '\n');
    git(up, 'add', '-A'); git(up, 'commit', '-q', '-m', 'watcher: 1 new'); git(up, 'push', '-q');
    const r = await sync(ctx);
    expect(r).toMatchObject({ pulled: true, importedJobs: 1 });
    expect(read(local, 'README.md')).toBe('my unsaved local line\n');
    expect(git(local, 'stash', 'list')).toBe('');
    expect(originHead()).toBe(head(local)); // pushed
  });

  it('a leftover rebase folder with only an autostash (2026-09-30) is cleared; the stash is kept and Sync works', async () => {
    write(local, 'notes.txt', 'unsaved\n'); git(local, 'add', 'notes.txt');
    const sha = git(local, 'stash', 'create'); git(local, 'reset', '-q', '--hard');
    const dir = path.join(local, '.git', 'rebase-merge');
    fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'autostash'), sha + '\n');
    write(up, 'jobs/inbox/2026-09-30_0800.jsonl', inboxLine({ id: 'gh:a:9', title: 'PIM Intern' }) + '\n');
    git(up, 'add', '-A'); git(up, 'commit', '-q', '-m', 'watcher: 1 new'); git(up, 'push', '-q');
    const r = await sync(ctx);
    expect(r).toMatchObject({ pulled: true, importedJobs: 1 });
    expect(r.warning ?? '').not.toMatch(/rebase-merge/);
    expect(fs.existsSync(dir)).toBe(false);
    expect(git(local, 'stash', 'list')).toMatch(/autostash/); // kept, nothing lost
  });

  it('behind: pulls the watcher\'s new inbox file and imports it', async () => {
    write(up, 'jobs/inbox/2026-09-30_1200.jsonl', inboxLine({ id: 'gh:a:2', title: 'ECC Intern' }) + '\n');
    git(up, 'add', '-A'); git(up, 'commit', '-q', '-m', 'watcher: 1 new'); git(up, 'push', '-q');
    const r = await sync(ctx);
    expect(r).toMatchObject({ pulled: true, warning: null, importedFiles: ['jobs/inbox/2026-09-30_1200.jsonl'], importedJobs: 1, committed: true, pushed: true });
    expect(subjects(local, 3)).toEqual(['Dashboard: sync', 'watcher: 1 new', 'Dashboard: sync']); // tracker.csv regenerated with the new job
    expect(originHead()).toBe(head(local));
  });

  it('ahead: a local commit is pushed', async () => {
    write(local, 'README.md', 'line one\nline two\nlocal note\n');
    git(local, 'commit', '-q', '-am', 'local note');
    const r = await sync(ctx);
    expect(r).toMatchObject({ pulled: true, pushed: true, warning: null, committed: false });
    expect(git(origin, 'log', '-1', '--format=%s', 'main')).toBe('local note');
  });

  it('diverged: local and upstream commits on different files → rebased, both on GitHub, history linear', async () => {
    write(up, 'jobs/inbox/2026-09-30_1300.jsonl', inboxLine({ id: 'gh:a:3', title: 'HBM Intern' }) + '\n');
    git(up, 'add', '-A'); git(up, 'commit', '-q', '-m', 'watcher: HBM'); git(up, 'push', '-q');
    write(local, 'README.md', 'line one\nline two\nlocal edit\n');
    git(local, 'commit', '-q', '-am', 'local edit');
    const r = await sync(ctx);
    expect(r).toMatchObject({ pulled: true, pushed: true, warning: null, importedJobs: 1 });
    const log = subjects(local, 4);
    expect(log.slice(0, 3)).toEqual(['Dashboard: sync', 'local edit', 'watcher: HBM']);
    expect(git(local, 'rev-list', '--merges', '--count', 'HEAD')).toBe('0');
    expect(originHead()).toBe(head(local));
  });

  it('conflict: the rebase is aborted, nothing is lost or pushed, a warning explains it; upstream inbox files still import', async () => {
    write(up, 'README.md', 'line one\nUPSTREAM\n');
    write(up, 'jobs/inbox/2026-09-30_1400.jsonl', inboxLine({ id: 'gh:a:4', title: 'Upstream Intern' }) + '\n');
    git(up, 'add', '-A'); git(up, 'commit', '-q', '-m', 'upstream edit'); git(up, 'push', '-q');
    write(local, 'README.md', 'line one\nLOCAL\n');
    git(local, 'commit', '-q', '-am', 'local conflicting edit');
    write(local, 'notes-untracked.txt', 'keep me');
    const before = head(local); const originBefore = originHead();
    const r = await sync(ctx);
    expect(r.pulled).toBe(false);
    expect(r.pushed).toBe(false);
    expect(r.warning).toMatch(/conflict.*nothing was changed.*git pull --rebase/);
    expect(r.warning).toMatch(/Imported 1 new watcher file/);
    expect(r.importedFiles).toEqual(['jobs/inbox/2026-09-30_1400.jsonl']);
    expect(read(local, 'README.md')).toBe('line one\nLOCAL\n');
    expect(read(local, 'notes-untracked.txt')).toBe('keep me');
    expect(fs.existsSync(path.join(local, '.git', 'rebase-merge'))).toBe(false);
    expect(originHead()).toBe(originBefore);
    // local work: the conflicting commit is still there (plus the dashboard's own tracker commit on top)
    expect(git(local, 'log', '--format=%s', `${before}~1..HEAD`).split('\n')).toContain('local conflicting edit');
    expect(git(local, 'merge-base', '--is-ancestor', before, 'HEAD')).toBe('');
  });

  it('two PCs exported tracker.csv: the conflict is resolved by regenerating it, both commits land, pushed', async () => {
    write(up, 'jobs/tracker.csv', 'id,company\nother-pc,Work PC export\n');
    git(up, 'add', '-A'); git(up, 'commit', '-q', '-m', 'Dashboard: sync (work PC)'); git(up, 'push', '-q');
    write(local, 'jobs/tracker.csv', 'id,company\nthis-pc,Home PC export\n');
    git(local, 'commit', '-q', '-am', 'Dashboard: sync (home PC)');
    const r = await sync(ctx);
    expect(r).toMatchObject({ pulled: true, warning: null });
    expect(fs.existsSync(path.join(local, '.git', 'rebase-merge'))).toBe(false);
    expect(subjects(local, 4)).toEqual(expect.arrayContaining(['Dashboard: sync (work PC)']));
    // regenerated from this PC's database, not either hand-written version
    expect(read(local, 'jobs/tracker.csv')).toMatch(/PIM Intern/);
    expect(originHead()).toBe(head(local));
  });

  it('autostash: uncommitted edits to other files survive the pull and are not committed', async () => {
    write(up, 'jobs/inbox/2026-09-30_1500.jsonl', inboxLine({ id: 'gh:a:5', title: 'Another' }) + '\n');
    git(up, 'add', '-A'); git(up, 'commit', '-q', '-m', 'watcher'); git(up, 'push', '-q');
    write(local, 'README.md', 'line one\nline two\nwork in progress\n');
    write(local, 'targets/companies.csv', read(local, 'targets/companies.csv') + 'Staged Co,C,yes,manual,,,,,https://x.example,staged\n');
    git(local, 'add', 'targets/companies.csv');
    const r = await sync(ctx);
    expect(r).toMatchObject({ pulled: true, committed: true, pushed: true, warning: null });
    expect(read(local, 'README.md')).toBe('line one\nline two\nwork in progress\n');
    expect(read(local, 'targets/companies.csv')).toMatch(/Staged Co/);
    expect(git(local, 'show', '--name-only', '--format=', 'HEAD')).toBe('jobs/tracker.csv'); // only the dashboard's file
    // Both edits are still there and uncommitted. (git's autostash restores staged edits as unstaged: content kept, staging not.)
    const st = execFileSync('git', ['status', '--porcelain'], { cwd: local, encoding: 'utf8' });
    expect(st).toMatch(/^ M README\.md$/m);
    expect(st).toMatch(/^.M targets\/companies\.csv$|^M. targets\/companies\.csv$/m);
  });

  it('push failure is a warning; the local commit stays', async () => {
    git(local, 'remote', 'set-url', '--push', 'origin', path.join(base, 'does-not-exist.git'));
    write(local, 'README.md', 'line one\nline two\nx\n');
    git(local, 'commit', '-q', '-am', 'will not push');
    const r = await sync(ctx);
    expect(r.pulled).toBe(true);
    expect(r.pushed).toBe(false);
    expect(r.warning).toMatch(/git push failed \(1 local commit not on GitHub yet\)/);
    expect(subjects(local, 1)).toEqual(['will not push']);
  });

  it('"Commit and push automatically" off: Sync only pulls', async () => {
    updateSettings(db, ctx.cfg.runs, { autoCommit: false });
    write(local, 'README.md', 'line one\nline two\ny\n');
    git(local, 'commit', '-q', '-am', 'stays local');
    write(up, 'jobs/inbox/2026-09-30_1600.jsonl', inboxLine({ id: 'gh:a:6', title: 'New' }) + '\n');
    git(up, 'add', '-A'); git(up, 'commit', '-q', '-m', 'watcher'); git(up, 'push', '-q');
    const r = await sync(ctx);
    expect(r).toMatchObject({ pulled: true, committed: false, pushed: false, importedJobs: 1 });
    expect(git(origin, 'log', '-1', '--format=%s', 'main')).toBe('watcher');
    expect(status(local)).toMatch(/jobs\/tracker\.csv/); // regenerated but not committed
  });

  it('a sync inside a Claude run (commitAndPush: false) never commits or pushes', async () => {
    write(local, 'README.md', 'line one\nline two\nz\n');
    git(local, 'commit', '-q', '-am', 'local');
    const r = await sync(ctx, { commitAndPush: false });
    expect(r).toMatchObject({ pulled: true, committed: false, pushed: false });
    expect(git(origin, 'log', '-1', '--format=%s', 'main')).not.toBe('local');
  });
});

describe('commits after runs', () => {
  it('only the dashboard paths are committed (application folders included), with the run in the message', async () => {
    write(local, 'applications/Acme_PIM_2026-09-30/JD.md', '# JD');
    write(local, 'README.md', 'line one\nline two\nnot mine\n');
    const c = await commitPaths(ctx, 'Dashboard: prepare-job (run 3)');
    expect(c.committed).toBe(true);
    expect(c.files).toEqual(['applications/Acme_PIM_2026-09-30/JD.md']);
    expect(subjects(local, 1)).toEqual(['Dashboard: prepare-job (run 3)']);
    expect(status(local)).toBe('M README.md');
    expect((await commitPaths(ctx, 'nothing')).committed).toBe(false);
  });

  it('watcher/ edits are never committed by Sync (they stay the owner\'s); only the fix-watcher-errors run commits them', async () => {
    write(local, 'watcher/lib/hand-edit.js', '// work in progress');
    const r = await sync(ctx);
    expect(r.committed).toBe(false);
    expect(execFileSync('git', ['status', '--porcelain'], { cwd: local, encoding: 'utf8' })).toMatch(/\?\? watcher\//);
    const g = await commitAfterRun(ctx, 'Dashboard: fix-watcher-errors (run 2)', [...DASHBOARD_PATHS, ...WATCHER_PATHS]);
    expect(g).toMatchObject({ committed: true, files: ['watcher/lib/hand-edit.js'], pushed: true });
  });

  it('commitAfterRun pushes; it also pushes a commit the run made by itself (fix-watcher-errors)', async () => {
    write(local, 'watcher/lib/x.js', '// fixed');
    git(local, 'add', 'watcher/lib/x.js'); git(local, 'commit', '-q', '-m', 'Fix adapter (by Claude)');
    const g = await commitAfterRun(ctx, 'Dashboard: fix-watcher-errors (run 9)');
    expect(g).toMatchObject({ committed: false, pushed: true, warning: null });
    expect(originHead()).toBe(head(local));
  });

  it('a finished run (fake claude) is committed and pushed; the run panel gets the git result', async () => {
    fakeScenario(ctx.cfg.dataDir, 'success');
    const { app, runs } = createApp(ctx, { exportDelayMs: 0, fetchDescription: async () => { throw new Error('offline'); } });
    const { run } = (await request(app).post('/api/runs').send({ task: 'process-new-jobs', params: { limit: 1, skipManual: true } }).expect(201)).body;
    await runs.whenIdle();
    const done = (await request(app).get(`/api/runs/${run.id}`)).body;
    expect(done.status).toBe('succeeded');
    expect(done.progress.git).toMatchObject({ committed: true, files: ['jobs/tracker.csv'], pushed: true, warning: null });
    expect(subjects(local, 1)).toEqual([`Dashboard: process-new-jobs (run ${run.id})`]);
    expect(originHead()).toBe(head(local));
    expect(read(local, 'jobs/tracker.csv')).toMatch(/Fake (rank|final check)/);
    runs.shutdown();
  });
});
