// Self-update: when the dashboard's own code changes on disk (Claude edited it, or a Sync pulled new code), restart
// into the new version so the owner never has to. Only when started by start-dashboard.cmd (JOBWATCHER_SUPERVISED=1),
// which starts it again (and rebuilds the web page) when it exits with RESTART_CODE.
// Waits until the files have been quiet for a minute and no Claude run is active, and restarts only if the new code
// type-checks (a half-finished edit never takes the dashboard down).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { DASHBOARD_DIR } from './config';

export const RESTART_CODE = 75;
/** Changes on every start; the web page reloads itself when it sees a new one. */
export const BOOT_ID = `${Date.now()}`;
const WATCHED = ['server', 'shared', 'cli', 'web/src', 'web/index.html', 'package.json', '../watcher/lib'];
const SKIP = new Set(['node_modules', 'dist', '.cache']);

/** A hash of every watched file's path, size and modification time. */
export function codeFingerprint(root = DASHBOARD_DIR, watched = WATCHED): string {
  const h = crypto.createHash('sha1');
  const walk = (p: string) => {
    let st: fs.Stats;
    try { st = fs.statSync(p); } catch { return; }
    if (st.isDirectory()) {
      for (const name of fs.readdirSync(p).sort()) if (!SKIP.has(name)) walk(path.join(p, name));
    } else h.update(`${path.relative(root, p)}|${st.size}|${st.mtimeMs}\n`);
  };
  for (const w of watched) walk(path.join(root, w));
  return h.digest('hex');
}

/** `tsc --noEmit` over the dashboard: true when the new code compiles. */
export function typecheck(cwd = DASHBOARD_DIR): Promise<{ ok: boolean; output: string }> {
  return new Promise((resolve) => {
    const tsc = path.join(cwd, 'node_modules', 'typescript', 'bin', 'tsc');
    execFile(process.execPath, [tsc, '--noEmit'], { cwd, timeout: 180_000 }, (err, stdout, stderr) => resolve({ ok: !err, output: `${stdout}${stderr}`.trim() }));
  });
}

export interface SelfUpdateOptions {
  isIdle: () => boolean;
  restart: () => void;
  log?: (m: string) => void;
  fingerprint?: () => string;
  check?: () => Promise<{ ok: boolean; output: string }>;
  intervalMs?: number;
  quietMs?: number;
}

/** Polls the code fingerprint; returns a stop function. */
export function startSelfUpdate(o: SelfUpdateOptions): () => void {
  const fp = o.fingerprint || (() => codeFingerprint());
  const check = o.check || (() => typecheck());
  const log = o.log || ((m: string) => console.log(m));
  const boot = fp();
  let last = boot; let changedAt = 0; let busy = false; let rejected = '';
  const tick = async () => {
    if (busy) return;
    const now = fp();
    if (now === boot) { changedAt = 0; last = now; return; }
    if (now !== last) { last = now; changedAt = Date.now(); return; } // still changing: wait for quiet
    if (Date.now() - changedAt < (o.quietMs ?? 60_000) || !o.isIdle() || now === rejected) return;
    busy = true;
    try {
      const r = await check();
      if (!r.ok) { rejected = now; log(`New dashboard code does not compile yet; staying on the running version.\n${r.output.slice(0, 2000)}`); return; }
      if (!o.isIdle()) return;
      log('The dashboard code changed: restarting into the new version…');
      clearInterval(timer);
      o.restart();
    } finally { busy = false; }
  };
  const timer = setInterval(() => { tick().catch((e) => log(`Self-update check failed: ${e.message}`)); }, o.intervalMs ?? 15_000);
  timer.unref();
  return () => clearInterval(timer);
}
