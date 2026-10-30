import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ALWAYS_DENY, BUILTIN_TOOLS, buildClaudeArgs, scratchDir } from '../../server/runs/args';
import { buildPrompt, continuePrompt } from '../../server/runs/prompts';
import { describeTool, isUsageLimit, parseResetTime, StreamParser } from '../../server/runs/stream';
import { CHROME_READ_TOOLS, effectiveTask, TASK_IDS, TASKS } from '../../server/runs/tasks';
import { dedupeKey, validateParams } from '../../server/runs/params';
import { resolveClaude, runEnv } from '../../server/runs/claude';
import { recoverOrphans, insertRun, updateRun, getRun } from '../../server/runs/store';
import { loadConfig } from '../../server/config';
import { importLocal } from '../../server/sync';
import { makeFixture, type Fixture } from '../helpers';

const cfg = loadConfig({ repoRoot: os.tmpdir() });
const argsFor = (id: (typeof TASK_IDS)[number], resume?: string) =>
  buildClaudeArgs(effectiveTask(id, cfg), { runId: 7, prompt: 'PROMPT TEXT', resume });

/** The values after a variadic flag, up to the next --flag. */
function listAfter(args: string[], flag: string): string[] {
  const i = args.indexOf(flag);
  if (i < 0) return [];
  const out: string[] = [];
  for (let k = i + 1; k < args.length && !args[k].startsWith('--'); k++) out.push(args[k]);
  return out;
}

describe('buildClaudeArgs', () => {
  it.each(TASK_IDS)('%s: prompt first, stream-json, limits, no global MCP/plugins, no bypass flags', (id) => {
    const t = effectiveTask(id, cfg);
    const a = argsFor(id);
    expect(a.slice(0, 2)).toEqual(['-p', 'PROMPT TEXT']);
    expect(a).toEqual(expect.arrayContaining(['--output-format', 'stream-json', '--verbose', '--strict-mcp-config']));
    expect(a[a.indexOf('--model') + 1]).toBe(t.model);
    expect(a[a.indexOf('--effort') + 1]).toBe(t.effort);
    expect(a[a.indexOf('--max-turns') + 1]).toBe(String(t.maxTurns));
    expect(a[a.indexOf('--permission-mode') + 1]).toBe('dontAsk');
    expect(a[a.indexOf('--permission-prompts') + 1]).toBe('none');
    expect(a[a.indexOf('--setting-sources') + 1]).toBe('project');
    expect(a[a.indexOf('--tools') + 1]).toBe(BUILTIN_TOOLS.join(','));
    expect(a.join(' ')).not.toMatch(/bypassPermissions|dangerously|--mcp-config/);
    // --allowedTools is last, so nothing can be swallowed by it
    expect(a.indexOf('--allowedTools')).toBeGreaterThan(a.indexOf('--disallowedTools'));
    expect(listAfter(a, '--allowedTools').length).toBe(a.length - a.indexOf('--allowedTools') - 1);
    expect(listAfter(a, '--disallowedTools').slice(0, ALWAYS_DENY.length)).toEqual(ALWAYS_DENY);
  });

  it('Chrome tools a task may not use are removed from its context (--disallowedTools)', () => {
    const off = listAfter(argsFor('check-manual-companies'), '--disallowedTools');
    expect(off).toEqual(expect.arrayContaining(['mcp__claude-in-chrome__form_input', 'mcp__claude-in-chrome__computer', 'mcp__claude-in-chrome__file_upload', 'mcp__claude-in-chrome__gif_creator']));
    for (const t of CHROME_READ_TOOLS) expect(off).not.toContain(t);
    expect(listAfter(argsFor('follow-ups'), '--disallowedTools')).toEqual(ALWAYS_DENY);
  });

  it('--chrome only for browser tasks; --no-chrome for everything else', () => {
    for (const id of TASK_IDS) {
      const a = argsFor(id);
      if (TASKS[id].chrome) { expect(a, id).toContain('--chrome'); expect(a, id).not.toContain('--no-chrome'); }
      else { expect(a, id).toContain('--no-chrome'); expect(a, id).not.toContain('--chrome'); }
    }
  });

  it('allowlists: base tools for all; applications/ only for prepare tasks; watcher/ + git only for fix-watcher-errors; no push anywhere', () => {
    const base = ['Read', 'Glob', 'Grep', 'Bash(node dashboard/cli *)', `Edit(${scratchDir(7)}/**)`, `Write(${scratchDir(7)}/**)`, 'WebSearch', 'WebFetch'];
    for (const id of TASK_IDS) {
      const allow = listAfter(argsFor(id), '--allowedTools');
      expect(allow, id).toEqual(expect.arrayContaining(base));
      expect(allow.some((r) => /git push/.test(r)), id).toBe(false);
      expect(allow.some((r) => r.startsWith('Edit(applications')), id).toBe(['process-decisions', 'prepare-job'].includes(id));
      expect(allow.some((r) => r.startsWith('Edit(watcher')), id).toBe(id === 'fix-watcher-errors');
      expect(allow.some((r) => r.startsWith('Bash(git ')), id).toBe(id === 'fix-watcher-errors');
    }
    const chrome = listAfter(argsFor('check-manual-companies'), '--allowedTools');
    expect(chrome).toEqual(expect.arrayContaining(CHROME_READ_TOOLS));
    expect(chrome.some((r) => /form_input|computer|file_upload/.test(r))).toBe(false); // read/navigate only
    expect(listAfter(argsFor('cold-emails'), '--allowedTools')).toContain('Bash(node dashboard/cli research *)');
  });

  it('--resume <session> for Continue', () => {
    const a = argsFor('follow-ups', 'sess-123');
    expect(a[a.indexOf('--resume') + 1]).toBe('sess-123');
    expect(argsFor('follow-ups')).not.toContain('--resume');
  });

  it('model, effort and limits come from config.json overrides', () => {
    const c = loadConfig({ repoRoot: os.tmpdir(), runs: { tasks: { 'follow-ups': { model: 'haiku', effort: 'medium', maxTurns: 9, timeoutMin: 3 } }, keepLogs: 5, autoCommit: false, manualCheckEveryHours: 24, finalMinFit: 60 } });
    const t = effectiveTask('follow-ups', c);
    expect(t).toMatchObject({ model: 'haiku', effort: 'medium', maxTurns: 9, timeoutMin: 3 });
    const a = buildClaudeArgs(t, { runId: 1, prompt: 'x' });
    expect(a[a.indexOf('--model') + 1]).toBe('haiku');
    expect(a[a.indexOf('--max-turns') + 1]).toBe('9');
  });

  it('default models follow the plan table (lighter models for simple tasks)', () => {
    expect(TASKS['process-new-jobs']).toMatchObject({ model: 'sonnet', effort: 'low' });
    expect(TASKS['final-check']).toMatchObject({ model: 'opus', effort: 'medium' });
    expect(TASKS['check-manual-companies']).toMatchObject({ model: 'sonnet', effort: 'low', maxTurns: 200, timeoutMin: 45, chrome: true });
    expect(TASKS['process-decisions']).toMatchObject({ model: 'opus', effort: 'medium', maxTurns: 60, timeoutMin: 30 });
    expect(TASKS['follow-ups']).toMatchObject({ model: 'sonnet', effort: 'low', maxTurns: 30, timeoutMin: 15 });
    expect(TASKS['fix-watcher-errors']).toMatchObject({ model: 'opus', effort: 'medium' });
  });
});

describe('prompts', () => {
  it('say which CLAUDE.md command to run, the limits, the headless rules and the scratch folder', () => {
    const p = buildPrompt(TASKS['process-new-jobs'], { runId: 3, params: { limit: 3 } });
    expect(p).toMatch(/running headless from the JobWatcher dashboard/);
    expect(p).toMatch(/"process new jobs" command exactly as defined in CLAUDE\.md, for at most 3 jobs/);
    expect(p).toMatch(/data\/scratch\/run-3\//);
    expect(p).toMatch(/never submit applications/);
    expect(p).toMatch(/Do not ask questions/);
    const prep = buildPrompt(TASKS['prepare-job'], { runId: 1, params: {}, job: { id: 'j1', company: 'Acme', title: 'PIM Intern', url: 'https://a' } });
    expect(prep).toMatch(/prepare <company> <role>.*Acme, PIM Intern \(job id j1/);
    expect(continuePrompt('use the ISCA paper')).toMatch(/the owner says: use the ISCA paper/);
    expect(continuePrompt(undefined)).not.toMatch(/the owner says/);
  });
});

describe('stream parser', () => {
  const lines = [
    JSON.stringify({ type: 'system', subtype: 'init', session_id: 's1', model: 'claude-sonnet-5-5', tools: ['Read', 'Bash'], mcp_servers: [{ name: 'claude-in-chrome', status: 'connected' }] }),
    JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'Reading the profile.' }, { type: 'tool_use', id: 't1', name: 'Read', input: { file_path: 'C:\\repo\\profile\\master_profile.md' } }] } }),
    JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 't1', content: '…' }] } }),
    JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', id: 't2', name: 'Bash', input: { command: 'node dashboard/cli rank "wd:nvidia:JR1" --fit 82 --reason "Memory"' } }] } }),
    JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 't2', content: '{"job":{}}' }] } }),
    JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', id: 't3', name: 'Bash', input: { command: 'node dashboard/cli rank bad --fit 500 --reason x' } }] } }),
    JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 't3', content: '{"error":"--fit must be a number from 0 to 100"}', is_error: true }] } }),
    'this is not json',
    '',
    JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', id: 't4', name: 'Bash', input: { command: 'git push' } }] } }),
    JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 't4', content: 'Permission to use Bash with command git push has been denied.', is_error: true }] } }),
    JSON.stringify({ type: 'result', subtype: 'success', is_error: false, result: '## Done\nRanked 1', num_turns: 4, duration_ms: 9000, total_cost_usd: 0.05, session_id: 's1', usage: { input_tokens: 10, output_tokens: 20, cache_read_input_tokens: 300, cache_creation_input_tokens: 4 }, permission_denials: [{}] }),
  ];

  it('builds the progress model: init, human steps, counters only for successful writes, malformed lines, result', () => {
    const p = new StreamParser();
    for (const l of lines) p.push(l);
    expect(p.sessionId).toBe('s1');
    expect(p.progress.model).toBe('claude-sonnet-5-5');
    expect(p.chromeStatus()).toBe('connected');
    expect(p.progress.steps.map((s) => s.text)).toEqual([
      'Started (claude-sonnet-5-5)', 'Reading master_profile.md', 'Ranking wd:nvidia:JR1: fit 82', 'Ranking bad: fit 500', 'Running: git push',
      'Not allowed: Permission to use Bash with command git push has been denied.', 'Finished',
    ]);
    expect(p.progress.counters).toMatchObject({ ranked: 1, toolCalls: 4, denied: 1 });
    expect(p.progress.malformed).toBe(1);
    expect(p.progress.lastText).toBe('Reading the profile.');
    expect(p.progress.usage).toEqual({ input_tokens: 10, output_tokens: 20, cache_read_input_tokens: 300, cache_creation_input_tokens: 4 });
    expect(p.result).toMatchObject({ subtype: 'success', isError: false, text: '## Done\nRanked 1', numTurns: 4, costUsd: 0.05, denials: 1 });
  });

  it('result subtypes and a missing Chrome server', () => {
    const p = new StreamParser();
    p.push(JSON.stringify({ type: 'system', subtype: 'init', session_id: 's', mcp_servers: [{ name: 'claude-in-chrome', status: 'failed' }] }));
    expect(p.chromeStatus()).toBe('failed');
    p.push(JSON.stringify({ type: 'result', subtype: 'error_max_turns', is_error: true, num_turns: 25 }));
    expect(p.result).toMatchObject({ subtype: 'error_max_turns', isError: true, numTurns: 25 });
    const q = new StreamParser();
    q.push(JSON.stringify({ type: 'system', subtype: 'init', mcp_servers: [] }));
    expect(q.chromeStatus()).toBeNull();
    q.push(JSON.stringify({ type: 'result', subtype: 'error_during_execution', is_error: true, errors: ['boom'] }));
    expect(q.result).toMatchObject({ subtype: 'error_during_execution', text: 'boom' });
    expect(new StreamParser().push('[1,2')).toBeNull();
  });

  it('describes CLI and browser tool calls in plain words', () => {
    expect(describeTool('Bash', { command: 'node dashboard/cli status wd:x:1 prepared --dir applications/X' })).toEqual({ text: 'Setting wd:x:1 to prepared', counter: 'statuses' });
    expect(describeTool('Bash', { command: 'node dashboard/cli outreach add --type cold_email --contact 3 --body-file d.txt' })).toEqual({ text: 'Drafting a cold email', counter: 'outreach' });
    expect(describeTool('Bash', { command: 'node dashboard/cli contact add --name "Dr. Kim" --company Micron' })).toEqual({ text: 'Adding contact Dr. Kim', counter: 'contacts' });
    expect(describeTool('Bash', { command: 'node dashboard/cli job add --company Meta --title "PhD Intern, MTIA" --url u' })).toEqual({ text: 'Adding job: PhD Intern, MTIA', counter: 'jobsAdded' });
    expect(describeTool('Bash', { command: 'node dashboard/cli jobs --for-ranking --limit 40' }).text).toBe('Reading the job cards');
    expect(describeTool('mcp__claude-in-chrome__navigate', { url: 'https://www.metacareers.com/jobs?q=intern' }).text).toBe('Opening metacareers.com');
    expect(describeTool('WebSearch', { query: 'Jane Doe NVIDIA LinkedIn' }).text).toBe('Searching the web: "Jane Doe NVIDIA LinkedIn"');
  });

  it('detects the plan usage limit and when it resets', () => {
    const now = new Date(2026, 8, 30, 10, 0);
    expect(isUsageLimit("You've hit your limit · resets 3pm (America/New_York)")).toBe(true);
    expect(isUsageLimit('Claude AI usage limit reached|1759262400')).toBe(true);
    expect(isUsageLimit('Ranked 3 jobs')).toBe(false);
    expect(parseResetTime('Claude AI usage limit reached|1759262400', now)).toBe(new Date(1759262400 * 1000).toISOString());
    expect(new Date(parseResetTime('resets 3pm', now)!).getHours()).toBe(15);
    const early = new Date(parseResetTime('resets at 9:30 AM', now)!); // already past today → tomorrow
    expect([early.getMonth(), early.getDate(), early.getHours(), early.getMinutes()]).toEqual([9, 1, 9, 30]); // Oct 1
    expect(parseResetTime('no time here', now)).toBeNull();
    const p = new StreamParser(undefined, () => now);
    p.push(JSON.stringify({ type: 'result', subtype: 'success', is_error: true, result: "You've hit your limit · resets 3pm" }));
    expect(p.progress.usageLimit?.resetsAt).toBeTruthy();
  });
});

describe('params, dedupe, orphans', () => {
  let fx: Fixture;
  afterEach(() => fx?.cleanup());

  it('validates ids, companies, numbers; applies defaults; refuses unknown params', () => {
    fx = makeFixture(); importLocal(fx.ctx);
    expect(validateParams(TASKS['process-new-jobs'], {}, fx.db).params).toEqual({ limit: 40 });
    expect(validateParams(TASKS['process-new-jobs'], { limit: '3' }, fx.db).params).toEqual({ limit: 3 });
    expect(() => validateParams(TASKS['process-new-jobs'], { limit: 'x' }, fx.db)).toThrow(/whole number/);
    expect(() => validateParams(TASKS['process-new-jobs'], { limit: 0 }, fx.db)).toThrow(/between/);
    expect(() => validateParams(TASKS['process-new-jobs'], { rm: '-rf' }, fx.db)).toThrow(/Unknown parameter/);
    expect(() => validateParams(TASKS['prepare-job'], {}, fx.db)).toThrow(/needs the parameter "jobId"/);
    expect(() => validateParams(TASKS['prepare-job'], { jobId: 'nope' }, fx.db)).toThrow(/No job/);
    const ok = validateParams(TASKS['prepare-job'], { jobId: 'wd:micron:JR111017' }, fx.db);
    expect(ok.info.job).toMatchObject({ company: 'Micron' });
    expect(validateParams(TASKS['cold-emails-company'], { company: 'nvidia' }, fx.db).params.company).toBe('NVIDIA');
    expect(() => validateParams(TASKS['cold-emails-company'], { company: 'Evil"; rm -rf /' }, fx.db)).toThrow(/Unknown company/);
    expect(dedupeKey(TASKS['prepare-job'], { jobId: 'a' })).not.toBe(dedupeKey(TASKS['prepare-job'], { jobId: 'b' }));
    expect(dedupeKey(TASKS['follow-ups'], {})).toBe('follow-ups');
  });

  it('recoverOrphans marks dead running runs failed and leftover queued ones cancelled; keeps live ones', () => {
    fx = makeFixture();
    const a = insertRun(fx.db, 'follow-ups', {}); updateRun(fx.db, a.id, { status: 'running', pid: 111 });
    const b = insertRun(fx.db, 'weekly-review', {}); updateRun(fx.db, b.id, { status: 'running', pid: 222 });
    const c = insertRun(fx.db, 'cold-emails', {});
    expect(recoverOrphans(fx.db, (pid) => pid === 222)).toBe(2);
    expect(getRun(fx.db, a.id)).toMatchObject({ status: 'failed', error: expect.stringMatching(/restarted/) });
    expect(getRun(fx.db, b.id).status).toBe('running');
    expect(getRun(fx.db, c.id).status).toBe('cancelled');
  });
});

describe('claude command resolution and environment', () => {
  it('a .mjs file runs with node; a missing command resolves to null; Windows .cmd shims resolve to the .exe', () => {
    const fake = path.resolve(__dirname, '../fakes/claude.mjs');
    expect(resolveClaude(fake, { fresh: true })).toMatchObject({ file: process.execPath, prefix: [fake] });
    expect(resolveClaude('definitely-not-a-claude-binary-xyz', { fresh: true })).toBeNull();
    if (process.platform === 'win32') {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jw-shim-'));
      fs.mkdirSync(path.join(dir, 'node_modules', 'x', 'bin'), { recursive: true });
      const exe = path.join(dir, 'node_modules', 'x', 'bin', 'claude.exe');
      fs.writeFileSync(exe, '');
      fs.writeFileSync(path.join(dir, 'claude.cmd'), '@ECHO off\r\n"%dp0%\\node_modules\\x\\bin\\claude.exe"   %*\r\n');
      expect(resolveClaude(path.join(dir, 'claude.cmd'), { fresh: true })).toMatchObject({ file: exe, prefix: [] });
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('runs never get an API key (plan login only) and are tagged with the run id', () => {
    const env = runEnv({ PATH: 'p', ANTHROPIC_API_KEY: 'sk-x', CLAUDECODE: '1' }, { JOBWATCHER_RUN_ID: '5' });
    expect(env).toEqual({ PATH: 'p', JOBWATCHER_RUN_ID: '5' });
  });
});
