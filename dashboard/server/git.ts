import { execFile } from 'node:child_process';

export interface GitResult { code: number; stdout: string; stderr: string }
/** Runs one git command in the repo. Tests pass a fake. */
export type GitRunner = (args: string[], cwd: string) => Promise<GitResult>;

export const realGit: GitRunner = (args, cwd) => new Promise((resolve) => {
  execFile('git', args, { cwd, timeout: 90_000, windowsHide: true, maxBuffer: 64 * 1024 * 1024, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } },
    (err, stdout, stderr) => {
      const code = err ? (typeof (err as NodeJS.ErrnoException & { code?: unknown }).code === 'number' ? Number((err as { code: number }).code) : 1) : 0;
      resolve({ code, stdout: String(stdout), stderr: String(stderr || (err && !stderr ? err.message : '')) });
    });
});

/** A git that does nothing (JOBWATCHER_GIT=off, used by the e2e server). */
export const noGit: GitRunner = async (args) =>
  args[0] === 'pull' || args[0] === 'fetch' ? { code: 0, stdout: 'Already up to date. (git disabled)', stderr: '' } : { code: 1, stdout: '', stderr: 'git disabled' };
