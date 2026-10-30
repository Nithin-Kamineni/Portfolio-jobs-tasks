// Starts the dashboard server on 127.0.0.1 (local only).
//   tsx server/index.ts [--open] [--no-sync] [--no-cloud-sync]
// Env: PORT, JOBWATCHER_REPO, JOBWATCHER_DATA, JOBWATCHER_DB, JOBWATCHER_GIT=off (never run git), JOBWATCHER_CLOUD_SYNC=off.
import path from 'node:path';
import { exec } from 'node:child_process';
import type { Server } from 'node:http';
import { DASHBOARD_DIR, loadConfig, type Config } from './config';
import { dailyBackup, openDb } from './db';
import { noGit, realGit, type GitRunner } from './git';
import { createApp, type AppOptions } from './app';
import { importLocal, sync, type Ctx } from './sync';
import { exportTracker } from './exporter';
import { RESTART_CODE, startSelfUpdate } from './selfUpdate';
import type { RunManager } from './runs/runner';
import { CloudSyncScheduler, setActiveScheduler, wranglerD1 } from './cloudSync';
import { realActions, RunRequestPoller } from './runRequests';
import { BOOT_ID } from './selfUpdate';
import { DescriptionKeeper, setActiveKeeper } from './descriptionKeeper';
import { fetchDescription } from '../../watcher/lib/describe.js';

export async function startServer(cfg: Config, opts: { git?: GitRunner; sync?: boolean; open?: boolean; cloudSync?: boolean; keepDescriptions?: boolean; quiet?: boolean; extend?: AppOptions['extend']; runOptions?: AppOptions['runOptions'] } = {}): Promise<{ server: Server; ctx: Ctx; url: string; runs: RunManager; queue: RunRequestPoller | null }> {
  const db = openDb(cfg.dbPath);
  const ctx: Ctx = { db, cfg, git: opts.git || realGit };
  importLocal(ctx);
  exportTracker(db, cfg.repoRoot);
  const { app, runs } = createApp(ctx, { staticDir: path.join(DASHBOARD_DIR, 'web', 'dist'), extend: opts.extend, runOptions: opts.runOptions });
  const orphans = runs.recover();
  const url = `http://localhost:${cfg.port}`;
  const server = await new Promise<Server>((resolve, reject) => {
    const s = app.listen(cfg.port, '127.0.0.1', () => resolve(s));
    s.on('error', reject);
  });
  const log = (m: string) => { if (!opts.quiet) console.log(m); };
  log(`JobWatcher dashboard: ${url}  (database: ${cfg.dbPath})`);
  if (orphans) log(`Marked ${orphans} unfinished Claude run(s) from before the restart as stopped.`);
  if (opts.sync !== false) {
    sync(ctx).then((r) => log(`Sync: ${r.importedJobs} new job(s)${r.warning ? `. Warning: ${r.warning}` : ''}`)).catch((e) => log(`Sync failed: ${e.message}`));
  }
  // Descriptions of Referral/Applied/Interview jobs: fetched while the posting is live, saved as applications/<dir>/JD.md.
  let keeper: DescriptionKeeper | null = null;
  if (opts.keepDescriptions) {
    keeper = new DescriptionKeeper(db, cfg.repoRoot, fetchDescription, log);
    setActiveKeeper(keeper);
    keeper.start();
  }
  // Two-way sync with the website (D1): only the real dashboard (not tests), and only when config.json turns it on.
  let cloud: CloudSyncScheduler | null = null;
  if (opts.cloudSync && cfg.cloudSync.enabled) {
    cloud = new CloudSyncScheduler(db, wranglerD1(cfg.siteDir), {
      machine: cfg.machine, intervalMinutes: cfg.cloudSync.intervalMinutes, debounceSeconds: cfg.cloudSync.debounceSeconds,
      onLocalChanges: () => { exportTracker(db, cfg.repoRoot); keeper?.kick(); }, log,
    });
    setActiveScheduler(cloud);
    cloud.start();
    log(`Cloud sync: on (every ${cfg.cloudSync.intervalMinutes} min, ${cfg.cloudSync.debounceSeconds} s after a change)`);
  }
  // The website's PC queue (Process new jobs, Sync, Fetch description, … clicked on the website): needs the cloud sync.
  let queue: RunRequestPoller | null = null;
  if (cloud && cfg.runRequests.enabled) {
    queue = new RunRequestPoller(wranglerD1(cfg.siteDir, 60_000), realActions(ctx, runs, cloud), {
      machine: cfg.machine, version: `dashboard ${BOOT_ID}`, intervalMs: cfg.runRequests.intervalSeconds * 1000, progressEveryMs: cfg.runRequests.progressSeconds * 1000, log,
    });
    queue.start();
    log(`Website queue: on (checks every ${cfg.runRequests.intervalSeconds} s)`);
  }
  const backup = setInterval(() => { dailyBackup(db, cfg.backupDir, cfg.backupKeep).catch(() => undefined); }, 60 * 60 * 1000);
  backup.unref();
  server.on('close', () => { clearInterval(backup); queue?.stop(); if (keeper) { keeper.stop(); setActiveKeeper(null); } if (cloud) { cloud.stop(); setActiveScheduler(null); } runs.shutdown(); db.close(); });
  if (opts.open && !process.env.JOBWATCHER_NO_OPEN) exec(process.platform === 'win32' ? `start "" "${url}"` : `${process.platform === 'darwin' ? 'open' : 'xdg-open'} "${url}"`);
  return { server, ctx, url, runs, queue };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]).replace(/\.ts$/, '') === path.resolve(DASHBOARD_DIR, 'server', 'index');
if (isMain) {
  const args = process.argv.slice(2);
  const cfg = loadConfig();
  startServer(cfg, { git: process.env.JOBWATCHER_GIT === 'off' ? noGit : realGit, sync: !args.includes('--no-sync'), open: args.includes('--open'), cloudSync: !args.includes('--no-cloud-sync'), keepDescriptions: true })
    .then(({ server, runs, queue }) => {
      // Started by start-dashboard.cmd: restart into new code by itself (the script starts it again on RESTART_CODE).
      if (process.env.JOBWATCHER_SUPERVISED !== '1') return;
      startSelfUpdate({
        isIdle: () => runs.isIdle() && (queue?.isIdle() ?? true),
        restart: () => {
          server.close(() => process.exit(RESTART_CODE));
          server.closeAllConnections();
          setTimeout(() => process.exit(RESTART_CODE), 5000).unref();
        },
      });
    })
    .catch(async (e) => {
      if (e.code === 'EADDRINUSE') {
        // Already running (e.g. double-clicked twice)? Then just open it.
        const running = await fetch(`http://localhost:${cfg.port}/api/meta`).then((r) => r.ok).catch(() => false);
        if (running) {
          console.log(`The dashboard is already running at http://localhost:${cfg.port}`);
          if (args.includes('--open') && !process.env.JOBWATCHER_NO_OPEN) exec(process.platform === 'win32' ? `start "" "http://localhost:${cfg.port}"` : `${process.platform === 'darwin' ? 'open' : 'xdg-open'} "http://localhost:${cfg.port}"`);
          process.exit(0);
        }
        console.error(`Port ${cfg.port} is used by another program. Change "port" in dashboard/config.json.`);
      } else console.error(e);
      process.exit(1);
    });
}
