import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DASHBOARD_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const REPO_ROOT = path.resolve(DASHBOARD_DIR, '..');

/** Per-task overrides from config.json `runs.tasks.<id>` (defaults are in server/runs/tasks.ts). */
export interface TaskOverride { model?: string; effort?: string; maxTurns?: number; timeoutMin?: number }

export interface RunsConfig {
  tasks: Record<string, TaskOverride>;
  /** Raw stream logs kept in data/runs/ (newest N). */
  keepLogs: number;
  /** Commit (and push) repo files a run changed (plan v2 §7). */
  autoCommit: boolean;
  /** Visit a manual company again only when its last check is older than this (0 = every press). */
  manualCheckEveryHours: number;
  /** Quick scores at or above this get the Opus final check (plan §3.8 said 60; the owner chose 30 on 2026-09-30 after Sonnet under-scored borderline roles). */
  finalMinFit: number;
}

/** Two-way sync with the website's D1 database (server/cloudSync.ts). */
export interface CloudSyncConfig {
  enabled: boolean;
  /** Pull website edits this often. */
  intervalMinutes: number;
  /** Push local changes once things have been quiet this long. */
  debounceSeconds: number;
}

/** The website's queue (server/runRequests.ts): the PC claims requests from D1 and runs them like its own buttons. */
export interface RunRequestsConfig {
  /** Needs cloudSync.enabled as well. */
  enabled: boolean;
  /** Heartbeat + queue check this often while online. */
  intervalSeconds: number;
  /** Push a running run's progress to D1 this often. */
  progressSeconds: number;
}

/** This PC (home / work): its id is stable; the name shows on the website. */
export interface MachineConfig { id: string; name: string }

export interface Config {
  repoRoot: string;
  dataDir: string;
  dbPath: string;
  backupDir: string;
  backupKeep: number;
  port: number;
  outlookComposeUrl: string;
  outlookMaxUrlLength: number;
  resumeCandidates: string[];
  /** The Claude Code command (`claude`), or a .js/.mjs file run with node (the tests' fake claude). */
  claudeCommand: string;
  runs: RunsConfig;
  cloudSync: CloudSyncConfig;
  runRequests: RunRequestsConfig;
  /** dashboard/config.local.json (git-ignored) → machine, else the computer name. Env: JOBWATCHER_MACHINE_ID / _NAME. */
  machine: MachineConfig;
  /** The website project (wrangler runs from here for the cloud sync). */
  siteDir: string;
}

/**
 * Settings from dashboard/config.json, overridable with env vars (tests and e2e use these):
 * JOBWATCHER_REPO (repo root), JOBWATCHER_DATA (data dir), JOBWATCHER_DB (db file), PORT, JOBWATCHER_CLAUDE (claude command).
 */
export function loadConfig(overrides: Partial<Config> = {}): Config {
  let file: Record<string, unknown> = {};
  try { file = JSON.parse(fs.readFileSync(path.join(DASHBOARD_DIR, 'config.json'), 'utf8')); } catch { /* defaults */ }
  const repoRoot = overrides.repoRoot || process.env.JOBWATCHER_REPO || REPO_ROOT;
  const dataDir = overrides.dataDir || process.env.JOBWATCHER_DATA || path.join(repoRoot, 'data');
  const fr = (file.runs || {}) as Partial<RunsConfig>;
  const fc = (file.cloudSync || {}) as Partial<CloudSyncConfig>;
  const fq = (file.runRequests || {}) as Partial<RunRequestsConfig>;
  let localFile: Record<string, unknown> = {};
  try { localFile = JSON.parse(fs.readFileSync(path.join(DASHBOARD_DIR, 'config.local.json'), 'utf8')); } catch { /* none: defaults */ }
  const fm = (localFile.machine || {}) as Partial<MachineConfig>;
  const host = os.hostname() || 'pc';
  const machineId = String(overrides.machine?.id || process.env.JOBWATCHER_MACHINE_ID || fm.id || host).toLowerCase().replace(/[^a-z0-9._-]+/g, '-').slice(0, 60);
  return {
    repoRoot,
    dataDir,
    dbPath: overrides.dbPath || process.env.JOBWATCHER_DB || path.join(dataDir, 'jobwatcher.db'),
    backupDir: overrides.backupDir || path.join(dataDir, 'backups'),
    backupKeep: overrides.backupKeep ?? Number(file.backupKeep ?? 14),
    port: overrides.port ?? Number(process.env.PORT || file.port || 5178),
    outlookComposeUrl: overrides.outlookComposeUrl || String(file.outlookComposeUrl || 'https://outlook.office.com/mail/deeplink/compose'),
    outlookMaxUrlLength: overrides.outlookMaxUrlLength ?? Number(file.outlookMaxUrlLength ?? 2000),
    resumeCandidates: overrides.resumeCandidates || (file.resumeCandidates as string[] | undefined) || ['Resume/Resume.pdf'],
    claudeCommand: overrides.claudeCommand || process.env.JOBWATCHER_CLAUDE || String(file.claudeCommand || 'claude'),
    runs: {
      tasks: { ...(fr.tasks || {}), ...(overrides.runs?.tasks || {}) },
      keepLogs: overrides.runs?.keepLogs ?? Number(fr.keepLogs ?? 100),
      autoCommit: overrides.runs?.autoCommit ?? (fr.autoCommit !== false),
      manualCheckEveryHours: overrides.runs?.manualCheckEveryHours ?? Number(fr.manualCheckEveryHours ?? 24),
      finalMinFit: overrides.runs?.finalMinFit ?? Number(fr.finalMinFit ?? 30),
    },
    cloudSync: {
      enabled: overrides.cloudSync?.enabled ?? (fc.enabled === true && process.env.JOBWATCHER_CLOUD_SYNC !== 'off'),
      intervalMinutes: overrides.cloudSync?.intervalMinutes ?? Number(fc.intervalMinutes ?? 5),
      debounceSeconds: overrides.cloudSync?.debounceSeconds ?? Number(fc.debounceSeconds ?? 20),
    },
    runRequests: {
      enabled: overrides.runRequests?.enabled ?? (fq.enabled === true && process.env.JOBWATCHER_RUN_REQUESTS !== 'off'),
      intervalSeconds: overrides.runRequests?.intervalSeconds ?? Number(fq.intervalSeconds ?? 20),
      progressSeconds: overrides.runRequests?.progressSeconds ?? Number(fq.progressSeconds ?? 25),
    },
    machine: { id: machineId, name: String(overrides.machine?.name || process.env.JOBWATCHER_MACHINE_NAME || fm.name || host).slice(0, 60) },
    siteDir: overrides.siteDir || path.join(repoRoot, 'site'),
  };
}

/** Absolute path of the first resume file that exists (or the first candidate). */
export function resumePath(cfg: Config): string {
  const found = cfg.resumeCandidates.map((p) => path.join(cfg.repoRoot, p)).find((p) => fs.existsSync(p));
  return found || path.join(cfg.repoRoot, cfg.resumeCandidates[0] || 'Resume/Resume.pdf');
}
