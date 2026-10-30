// Builds the `claude` command line for one run. Pure, so every task's arguments are unit-tested (plan v2 §3.2, §3.7).
import { CHROME_ALL_TOOLS, type TaskDef } from './tasks';

/** Built-in tools a run may load at all. Everything else (Task, NotebookEdit, …) stays out of the context. */
export const BUILTIN_TOOLS = ['Read', 'Glob', 'Grep', 'Bash', 'Edit', 'Write', 'WebSearch', 'WebFetch'];

/** Draft files (e-mail bodies, descriptions) go here; data/ is gitignored. Relative to the repo root (the run's cwd). */
export const scratchDir = (runId: number) => `data/scratch/run-${runId}`;

export function baseAllow(runId: number): string[] {
  const s = scratchDir(runId);
  return ['Read', 'Glob', 'Grep', 'Bash(node dashboard/cli *)', `Edit(${s}/**)`, `Write(${s}/**)`, 'WebSearch', 'WebFetch'];
}

/** Never allowed, for any task (also denied explicitly, in case a rule above is broader than intended). */
export const ALWAYS_DENY = ['Bash(git push *)', 'Bash(git push)', 'Bash(rm -rf *)', 'Bash(git reset --hard *)',
  // LinkedIn links come from web search results only: no run may open or crawl LinkedIn pages (plan v2 §2).
  'WebFetch(domain:linkedin.com)', 'WebFetch(domain:www.linkedin.com)'];

export interface BuildArgsOptions {
  runId: number;
  prompt: string;
  /** Continue an earlier run's Claude session. */
  resume?: string | null;
}

/**
 * `claude -p "<prompt>" …`. The prompt goes FIRST: --allowedTools is variadic and swallows a trailing prompt.
 * - dontAsk + --permission-prompts none: anything not on the allowlist is denied automatically, never asked.
 * - --strict-mcp-config (no --mcp-config) and --setting-sources project: none of the owner's global MCP servers,
 *   plugins or user allow rules are loaded (smaller context; the allowlist below is the only permission source).
 * - --chrome only for browser tasks; everything else passes --no-chrome.
 */
export function buildClaudeArgs(task: TaskDef, opts: BuildArgsOptions): string[] {
  const args = [
    '-p', opts.prompt,
    '--output-format', 'stream-json', '--verbose',
    '--model', task.model, '--effort', task.effort,
    '--max-turns', String(task.maxTurns),
    '--permission-mode', 'dontAsk', '--permission-prompts', 'none',
    '--strict-mcp-config', '--setting-sources', 'project',
    '--tools', BUILTIN_TOOLS.join(','),
    task.chrome ? '--chrome' : '--no-chrome',
  ];
  if (opts.resume) args.push('--resume', opts.resume);
  // --settings still loads with --setting-sources project (checked on 2.1.263).
  const allow = [...new Set([...baseAllow(opts.runId), ...task.allow])];
  // Chrome tools this task may not use are removed from the context (smaller prompt, and no clicking/typing at all).
  const chromeOff = task.chrome ? CHROME_ALL_TOOLS.filter((t) => !allow.includes(t)) : [];
  args.push('--disallowedTools', ...ALWAYS_DENY, ...chromeOff);
  args.push('--allowedTools', ...allow);
  return args;
}
