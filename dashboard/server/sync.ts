// "Sync": git pull, import new watcher output, mirror the CSVs, back up, and regenerate tracker.csv.
import fs from 'node:fs';
import path from 'node:path';
import type { DB } from './db';
import { dailyBackup } from './db';
import type { Config } from './config';
import type { GitRunner } from './git';
import { exportTracker } from './exporter';
import { importInboxDir, importInboxText, importPeople, migrateTracker, mirrorCompanies, parseDigest, runDedupeBackfill } from './importer';
import { addEvent, getSettings, lastEvent, nowIso } from './repo';
import { commitPaths, pullRebase, pushIfAhead, withGitLock } from './gitsync';
import type { SyncResult, WatcherHealth } from '../shared/types';
import { syncSoon } from './cloudSync';

export interface Ctx { db: DB; cfg: Config; git: GitRunner }

/** Loads the database from the repo files without touching git (first start, CLI, tests). */
export function importLocal(ctx: Ctx): { files: string[]; jobs: number } {
  const { db, cfg } = ctx;
  mirrorCompanies(db, cfg.repoRoot);
  const migrated = migrateTracker(db, cfg.repoRoot) || 0;
  importPeople(db, cfg.repoRoot);
  const inbox = importInboxDir(db, cfg.repoRoot);
  runDedupeBackfill(db);
  return { files: inbox.files, jobs: inbox.jobs + migrated };
}

/** When the pull fails (local edits, diverged branch, file open in Excel), import inbox files that exist only upstream. */
async function importUpstreamInbox(ctx: Ctx): Promise<{ files: string[]; jobs: number }> {
  const { db, cfg, git } = ctx;
  const files: string[] = []; let jobs = 0;
  const ls = await git(['ls-tree', '--name-only', '@{u}', 'jobs/inbox/'], cfg.repoRoot);
  if (ls.code !== 0) return { files, jobs };
  for (const rel of ls.stdout.split(/\r?\n/).map((s) => s.trim()).filter((s) => s.endsWith('.jsonl'))) {
    if (fs.existsSync(path.join(cfg.repoRoot, rel))) continue;
    const show = await git(['show', `@{u}:${rel}`], cfg.repoRoot);
    if (show.code !== 0) continue;
    const n = importInboxText(db, rel, show.stdout);
    if (n != null) { files.push(rel); jobs += n; }
  }
  return { files, jobs };
}

/**
 * Sync: fetch + fast-forward/rebase/merge without ever stashing local edits (see pullRebase; a conflict is aborted, nothing changes, warning) → import → backup → export,
 * then, with "Commit and push automatically" on, commit the dashboard's files ("Dashboard: sync") and push when ahead.
 * `commitAndPush: false` for syncs inside a Claude run (`cli sync`): the run's own after-run commit handles git.
 */
export async function sync(ctx: Ctx, opts: { commitAndPush?: boolean } = {}): Promise<SyncResult> {
  const { db, cfg } = ctx;
  const at = nowIso();
  const commitAndPush = opts.commitAndPush ?? getSettings(db, cfg.runs).autoCommit;
  return withGitLock(async () => {
    const warnings: (string | null)[] = [];
    const pull = await pullRebase(ctx);
    warnings.push(pull.warning);
    const local = importLocal(ctx);
    const upstream = pull.pulled ? { files: [], jobs: 0 } : await importUpstreamInbox(ctx).catch(() => ({ files: [] as string[], jobs: 0 }));
    if (upstream.files.length && pull.warning) warnings.push(`(Imported ${upstream.files.length} new watcher file(s) straight from GitHub anyway.)`);
    try { await dailyBackup(db, cfg.backupDir, cfg.backupKeep); } catch { /* a failed backup must not block sync */ }
    const exp = exportTracker(db, cfg.repoRoot);
    let committed = false; let pushed = false;
    if (commitAndPush) {
      const c = await commitPaths(ctx, 'Dashboard: sync');
      committed = c.committed; warnings.push(c.warning);
      if (pull.pulled) { const p = await pushIfAhead(ctx); pushed = p.pushed; warnings.push(p.warning); }
    }
    const result: SyncResult = {
      at, pulled: pull.pulled, warning: warnings.filter(Boolean).join(' ') || null,
      importedFiles: [...local.files, ...upstream.files], importedJobs: local.jobs + upstream.jobs, exportWarning: exp.warning, committed, pushed,
    };
    addEvent(db, 'system', null, 'sync', result);
    syncSoon(); // the dashboard's cloud sync (no-op in the CLI and tests)
    return result;
  });
}

export function lastSync(db: DB): SyncResult | null {
  return (lastEvent(db, 'sync')?.detail as SyncResult | undefined) ?? null;
}

/** Last watcher run and its source errors: watcher/state/last_run.json, else the newest digest. */
export function watcherHealth(repoRoot: string): WatcherHealth {
  try {
    const lr = JSON.parse(fs.readFileSync(path.join(repoRoot, 'watcher', 'state', 'last_run.json'), 'utf8'));
    return { lastRunAt: lr.at ?? null, matches: lr.matches ?? null, errors: lr.errors ?? [], digest: lr.digest ?? null, source: 'last_run' };
  } catch { /* fall back to the digests */ }
  const dir = path.join(repoRoot, 'jobs', 'digests');
  const newest = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort().pop() : undefined;
  if (!newest) return { lastRunAt: null, matches: null, errors: [], digest: null, source: 'none' };
  const d = parseDigest(fs.readFileSync(path.join(dir, newest), 'utf8'), newest);
  return { lastRunAt: d.at, matches: d.rows.length, errors: d.errors, digest: `jobs/digests/${newest}`, source: 'digest' };
}
