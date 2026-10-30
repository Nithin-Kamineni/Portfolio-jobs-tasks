// Git for the dashboard (plan v2 §7): commit the files the dashboard owns, pull with rebase, push when ahead.
// Never force-pushes; on a rebase conflict the rebase is aborted (local state kept exactly) and a warning is returned.
import fs from 'node:fs';
import path from 'node:path';
import type { Ctx } from './sync';
import { exportTracker } from './exporter';

/** Repo paths the dashboard writes: committed automatically by Sync and after runs (nothing else is). */
export const DASHBOARD_PATHS = ['jobs/tracker.csv', 'applications'];
/** The fix-watcher-errors run may also change watcher/ (never committed for other runs or by Sync, so hand edits there stay yours). */
export const WATCHER_PATHS = ['watcher'];

const firstLines = (s: string, n = 3) => s.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, n).join(' ');
const out = (r: { stdout: string; stderr: string }) => `${r.stdout}\n${r.stderr}`;
const DISABLED = /git disabled/;

/** Runs git; a git that throws (not installed, spawn error) becomes a failed result, never an exception. */
const run = (ctx: Ctx, args: string[]) => ctx.git(args, ctx.cfg.repoRoot).catch((e: Error) => ({ code: 1, stdout: '', stderr: e.message }));

// One git operation at a time (Sync, after-run commits and pushes must not interleave).
let chain: Promise<unknown> = Promise.resolve();
export function withGitLock<T>(fn: () => Promise<T>): Promise<T> {
  const p = chain.then(fn, fn);
  chain = p.catch(() => undefined);
  return p;
}

const PORCELAIN = /^([ MADRCU?!]{2}) (.+)$/;

/** Changed/untracked files under `paths` (git status --porcelain), or null when git isn't usable here. */
export async function changedPaths(ctx: Ctx, paths: string[]): Promise<string[] | null> {
  const r = await run(ctx, ['status', '--porcelain', '--untracked-files=all', '--', ...paths]);
  if (r.code !== 0) return null;
  return r.stdout.split(/\r?\n/).map((l) => l.match(PORCELAIN)).filter((m): m is RegExpMatchArray => Boolean(m) && m![1] !== '!!').map((m) => m[2].replace(/^"|"$/g, ''));
}

export interface CommitResult { committed: boolean; files: string[]; warning: string | null }

/** `git add` + `git commit -- <paths>`: only these paths, so anything else the owner staged stays out of the commit. */
export async function commitPaths(ctx: Ctx, message: string, paths: string[] = DASHBOARD_PATHS): Promise<CommitResult> {
  const existing = paths.filter((p) => fs.existsSync(path.join(ctx.cfg.repoRoot, p)));
  if (!existing.length) return { committed: false, files: [], warning: null };
  const files = await changedPaths(ctx, existing);
  if (!files || !files.length) return { committed: false, files: [], warning: null };
  const add = await run(ctx, ['add', '--', ...existing]);
  if (add.code !== 0) return { committed: false, files, warning: DISABLED.test(add.stderr) ? null : `git add failed: ${firstLines(out(add))}` };
  const c = await run(ctx, ['commit', '-m', message, '--', ...existing]);
  if (c.code !== 0) {
    if (/nothing to commit|no changes added|nothing added/i.test(out(c))) return { committed: false, files: [], warning: null };
    return { committed: false, files, warning: `git commit failed: ${firstLines(out(c))}` };
  }
  return { committed: true, files, warning: null };
}

async function rebaseInProgress(ctx: Ctx): Promise<boolean> {
  const r = await run(ctx, ['rev-parse', '--git-dir']);
  if (r.code !== 0) return false;
  const dir = path.resolve(ctx.cfg.repoRoot, r.stdout.trim());
  return fs.existsSync(path.join(dir, 'rebase-merge')) || fs.existsSync(path.join(dir, 'rebase-apply'));
}

/**
 * A rebase folder left behind with nothing to replay (only the autostash note; seen on 2026-09-30 after git couldn't
 * re-apply an autostash while a file was open in Word) blocks every later pull. `git rebase --quit` clears it without
 * touching commits or files and keeps the autostash in the stash list. A real rebase in progress is left alone.
 */
async function clearStaleRebase(ctx: Ctx): Promise<boolean> {
  const r = await run(ctx, ['rev-parse', '--git-dir']);
  if (r.code !== 0) return false;
  const dir = path.resolve(ctx.cfg.repoRoot, r.stdout.trim());
  const stale = ['rebase-merge', 'rebase-apply'].some((d) => {
    const p = path.join(dir, d);
    return fs.existsSync(p) && !fs.existsSync(path.join(p, 'head-name')) && !fs.existsSync(path.join(p, 'next'));
  });
  if (!stale) return false;
  return (await run(ctx, ['rebase', '--quit'])).code === 0;
}

export interface PullResult { pulled: boolean; conflict: boolean; warning: string | null }

const count = async (ctx: Ctx, range: string) => { const r = await run(ctx, ['rev-list', '--count', range]); return r.code === 0 ? Number(r.stdout.trim()) || 0 : 0; };

/**
 * Brings in GitHub's commits WITHOUT ever stashing the owner's uncommitted edits (2026-09-30: `pull --autostash` moved them
 * aside and couldn't put them back because the Resume .docx was open in Word). `git fetch`, then:
 * - only GitHub moved → `merge --ff-only`: works with edited files in place as long as GitHub didn't change them;
 * - both moved, no uncommitted edits → `rebase` (linear history); a conflict → `rebase --abort`;
 * - both moved, uncommitted edits → `merge --no-edit` (git never touches the edited files); a conflict → `merge --abort`.
 * If GitHub changed a file that is edited locally, git refuses before changing anything → warning.
 */
export async function pullRebase(ctx: Ctx): Promise<PullResult> {
  await clearStaleRebase(ctx);
  const f = await run(ctx, ['fetch']);
  if (f.code !== 0) return { pulled: false, conflict: false, warning: `git fetch failed, so the dashboard is using the local copy. Git said: ${firstLines(out(f)) || `exit code ${f.code}`}` };
  const behind = await count(ctx, 'HEAD..@{u}');
  if (!behind) return { pulled: true, conflict: false, warning: null };
  const ahead = await count(ctx, '@{u}..HEAD');
  const dirty = (await run(ctx, ['status', '--porcelain', '--untracked-files=no'])).stdout.trim() !== '';
  const args = !ahead ? ['merge', '--ff-only', '@{u}'] : dirty ? ['merge', '--no-edit', '@{u}'] : ['rebase', '@{u}'];
  const r = await run(ctx, args);
  if (r.code === 0) return { pulled: true, conflict: false, warning: null };
  const text = firstLines(out(r)) || `exit code ${r.code}`;
  if (/would be overwritten/i.test(out(r))) {
    return { pulled: false, conflict: true, warning: `GitHub changed a file you are editing, so nothing was pulled and your edits are untouched. Commit or undo that edit, then Sync again. Git said: ${text}` };
  }
  // jobs/tracker.csv is regenerated from the database (both PCs write it): a conflict there only needs a fresh export.
  if (await resolveTrackerConflict(ctx)) return { pulled: true, conflict: false, warning: null };
  if (await rebaseInProgress(ctx)) await run(ctx, ['rebase', '--abort']);
  else await run(ctx, ['merge', '--abort']);
  return {
    pulled: false, conflict: true,
    warning: `git found a conflict between your local commits and GitHub, so nothing was changed (the dashboard uses the local copy). Fix it in a terminal with "git pull --rebase". Git said: ${text}`,
  };
}

const TRACKER = 'jobs/tracker.csv';

/**
 * When the only conflicted file is jobs/tracker.csv (two PCs exported it), take either side, finish the rebase/merge and
 * regenerate the file from this PC's database; the next commit carries the fresh export. False (nothing changed) when
 * any other file conflicts.
 */
export async function resolveTrackerConflict(ctx: Ctx): Promise<boolean> {
  for (let i = 0; i < 50; i++) {
    const u = await run(ctx, ['diff', '--name-only', '--diff-filter=U']);
    if (u.code !== 0) return false;
    const files = u.stdout.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const rebasing = await rebaseInProgress(ctx);
    if (files.some((f) => f !== TRACKER)) return false;
    if (files.length) {
      if ((await run(ctx, ['checkout', '--theirs', '--', TRACKER])).code !== 0) return false;
      if ((await run(ctx, ['add', '--', TRACKER])).code !== 0) return false;
    } else if (!rebasing) {
      break;
    }
    const c = rebasing ? await run(ctx, ['-c', 'core.editor=true', 'rebase', '--continue']) : await run(ctx, ['commit', '--no-edit']);
    if (!rebasing) { if (c.code !== 0) return false; break; }
    if (!(await rebaseInProgress(ctx))) { if (c.code !== 0) return false; break; }
    // still rebasing: the next commit may conflict on tracker.csv again → loop
  }
  if (await rebaseInProgress(ctx)) return false;
  try { exportTracker(ctx.db, ctx.cfg.repoRoot); } catch { /* the next export fixes it */ }
  return true;
}

export interface PushResult { pushed: boolean; ahead: number; warning: string | null }

/** Pushes when the branch is ahead of its upstream. Never forces. */
export async function pushIfAhead(ctx: Ctx): Promise<PushResult> {
  const c = await run(ctx, ['rev-list', '--count', '@{u}..HEAD']);
  const ahead = c.code === 0 ? Number(c.stdout.trim()) || 0 : 0;
  if (!ahead) return { pushed: false, ahead: 0, warning: null };
  const p = await run(ctx, ['push']);
  if (p.code === 0) return { pushed: true, ahead, warning: null };
  return { pushed: false, ahead, warning: `git push failed (${ahead} local commit${ahead === 1 ? '' : 's'} not on GitHub yet). Git said: ${firstLines(out(p))}` };
}

export interface GitAfterRun { committed: boolean; files: string[]; pushed: boolean; warning: string | null }

/** After a run: commit what it changed ("Dashboard: <task> (run <id>)"), then pull --rebase and push. */
export function commitAfterRun(ctx: Ctx, message: string, paths: string[] = DASHBOARD_PATHS): Promise<GitAfterRun> {
  return withGitLock(async () => {
    const c = await commitPaths(ctx, message, paths);
    const warnings = [c.warning];
    let pushed = false;
    // Push also when the run committed by itself (fix-watcher-errors may `git commit`).
    const ahead = await run(ctx, ['rev-list', '--count', '@{u}..HEAD']);
    if (c.committed || (ahead.code === 0 && Number(ahead.stdout.trim()) > 0)) {
      const pl = await pullRebase(ctx);
      warnings.push(pl.warning);
      if (pl.pulled) { const ps = await pushIfAhead(ctx); pushed = ps.pushed; warnings.push(ps.warning); }
    }
    return { committed: c.committed, files: c.files, pushed, warning: warnings.filter(Boolean).join(' ') || null };
  });
}
