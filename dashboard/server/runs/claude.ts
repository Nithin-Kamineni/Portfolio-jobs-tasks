// Finding and launching the `claude` executable, killing a run's process tree, and the preflight check.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile, execFileSync, spawn, type ChildProcess } from 'node:child_process';
import type { Preflight } from '../../shared/types';

export interface ResolvedCommand { file: string; prefix: string[]; display: string }

const cache = new Map<string, ResolvedCommand | null>();

/**
 * Resolves `config.claudeCommand` to something spawn() can run with shell: false (so no user text ever reaches a shell).
 * - a .js/.mjs/.cjs file → run with this node (the tests' fake claude);
 * - an existing path → itself;
 * - a name on PATH → `where`/`which`; on Windows the npm shim claude.cmd is read to find the claude.exe it calls
 *   (Node refuses to spawn .cmd files without a shell).
 */
export function resolveClaude(cmd: string, opts: { fresh?: boolean } = {}): ResolvedCommand | null {
  if (!opts.fresh && cache.has(cmd)) return cache.get(cmd)!;
  const out = resolveUncached(cmd);
  cache.set(cmd, out);
  return out;
}

function fromCmdShim(file: string): string | null {
  try {
    const text = fs.readFileSync(file, 'utf8');
    const m = text.match(/"%dp0%\\([^"]+\.exe)"/i) || text.match(/"%~dp0\\([^"]+\.exe)"/i);
    if (!m) return null;
    const exe = path.join(path.dirname(file), m[1]);
    return fs.existsSync(exe) ? exe : null;
  } catch { return null; }
}

function resolveUncached(cmd: string): ResolvedCommand | null {
  if (!cmd) return null;
  if (/\.(m|c)?js$/i.test(cmd)) return fs.existsSync(cmd) ? { file: process.execPath, prefix: [cmd], display: `node ${cmd}` } : null;
  const candidates: string[] = [];
  if (path.isAbsolute(cmd) || cmd.includes('/') || cmd.includes('\\')) candidates.push(cmd);
  else {
    try {
      const found = execFileSync(process.platform === 'win32' ? 'where' : 'which', [cmd], { encoding: 'utf8', windowsHide: true, timeout: 10_000 });
      candidates.push(...found.split(/\r?\n/).map((l) => l.trim()).filter(Boolean));
    } catch { /* not on PATH */ }
  }
  if (process.platform === 'win32') {
    const exe = candidates.find((c) => /\.exe$/i.test(c) && fs.existsSync(c));
    if (exe) return { file: exe, prefix: [], display: exe };
    for (const c of candidates.filter((x) => /\.cmd$/i.test(x))) {
      const inner = fromCmdShim(c);
      if (inner) return { file: inner, prefix: [], display: inner };
    }
    return null;
  }
  const file = candidates.find((c) => fs.existsSync(c));
  return file ? { file, prefix: [], display: file } : null;
}

export function spawnResolved(r: ResolvedCommand, args: string[], opts: { cwd: string; env: NodeJS.ProcessEnv }): ChildProcess {
  return spawn(r.file, [...r.prefix, ...args], { cwd: opts.cwd, env: opts.env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true, shell: false });
}

/** Kills a run's whole process tree (claude starts child processes: shells, node CLI calls, MCP servers). */
export function killTree(child: ChildProcess | null, pid: number | null = child?.pid ?? null): void {
  if (!pid) return;
  if (process.platform === 'win32') {
    try { execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore', timeout: 15_000 }); }
    catch { try { child?.kill(); } catch { /* already gone */ } }
  } else {
    try { if (child) child.kill('SIGTERM'); else process.kill(pid, 'SIGTERM'); } catch { /* already gone */ }
  }
}

/** Environment for a run: the user's (the plan login lives in the profile) + run tagging + the dashboard's paths. */
export function runEnv(base: NodeJS.ProcessEnv, extra: Record<string, string>): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...base, ...extra };
  // Runs use the owner's Claude plan login, never API billing.
  delete env.ANTHROPIC_API_KEY;
  // Started from a Claude Code terminal? Then claude would refuse to start "inside another session".
  delete env.CLAUDECODE;
  return env;
}

/** Heuristic: the plan login is stored in ~/.claude/.credentials.json (Windows/Linux) or the macOS keychain (unknown). */
export function looksLoggedIn(home = os.homedir()): boolean | null {
  if (process.env.CLAUDE_CODE_OAUTH_TOKEN) return true;
  if (fs.existsSync(path.join(home, '.claude', '.credentials.json'))) return true;
  return process.platform === 'darwin' ? null : false;
}

let preflightCache: { key: string; at: number; value: Preflight } | null = null;
export const clearPreflightCache = () => { preflightCache = null; };

export const SETUP_MESSAGE = 'Open a terminal, run `claude`, log in once, then try again.';

/** `claude --version` works (and a login seems to exist). Cached for 60 s. */
export async function preflight(cmd: string, lastChromeRunAt: string | null, opts: { fresh?: boolean } = {}): Promise<Preflight> {
  const now = Date.now();
  if (!opts.fresh && preflightCache && preflightCache.key === cmd && now - preflightCache.at < 60_000) {
    return { ...preflightCache.value, lastChromeRunAt };
  }
  const resolved = resolveClaude(cmd, { fresh: true });
  const base = { command: cmd, resolved: resolved?.display ?? null, lastChromeRunAt, checkedAt: new Date(now).toISOString() };
  let value: Preflight;
  if (!resolved) {
    value = { ...base, ok: false, version: null, loggedIn: null, message: `Claude Code was not found ("${cmd}"). Install it (npm install -g @anthropic-ai/claude-code), then ${SETUP_MESSAGE.charAt(0).toLowerCase()}${SETUP_MESSAGE.slice(1)}` };
  } else {
    const version = await new Promise<string | null>((resolve) => {
      execFile(resolved.file, [...resolved.prefix, '--version'], { timeout: 20_000, windowsHide: true, env: runEnv(process.env, {}) }, (err, stdout) => {
        resolve(err ? null : String(stdout).trim().split(/\r?\n/)[0] || null);
      });
    });
    const fake = resolved.prefix.length > 0;
    const loggedIn = fake ? true : looksLoggedIn();
    value = !version
      ? { ...base, ok: false, version: null, loggedIn, message: `Claude Code didn't start (\`${cmd} --version\` failed). ${SETUP_MESSAGE}` }
      : loggedIn === false
        ? { ...base, ok: false, version, loggedIn, message: `Claude Code isn't logged in on this PC. ${SETUP_MESSAGE}` }
        : { ...base, ok: true, version, loggedIn, message: null };
  }
  preflightCache = { key: cmd, at: now, value };
  return value;
}
