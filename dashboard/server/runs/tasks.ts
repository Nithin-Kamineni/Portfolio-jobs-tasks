// The catalog of Claude tasks the dashboard can run (plan_dashboard_v2 §3.1). One entry per task.
// What a task *does* is defined in CLAUDE.md; this file only holds limits, tools and parameter rules.
import type { Config, TaskOverride } from '../config';

export const TASK_IDS = [
  'process-new-jobs', 'quick-rank', 'final-check', 'check-manual-companies', 'process-decisions', 'prepare-job',
  'cold-emails', 'cold-emails-company', 'follow-ups', 'weekly-review', 'fix-watcher-errors', 'conference-deadlines',
] as const;
export type TaskId = (typeof TASK_IDS)[number];

export type ParamKind = 'int' | 'bool' | 'job' | 'jobs' | 'company' | 'companies' | 'text' | 'ints' | 'url';
export interface ParamSpec { kind: ParamKind; required?: boolean; min?: number; max?: number; default?: unknown }

export interface TaskDef {
  id: TaskId;
  /** Short label for the Runs page and the app-bar pill ("ranking jobs"). */
  label: string;
  /** Present-tense activity for the pill: "Claude: ranking jobs". */
  activity: string;
  /** The CLAUDE.md command the prompt refers to. */
  command: string;
  /** Claude in Chrome needed. */
  chrome: boolean;
  model: string;
  effort: string;
  maxTurns: number;
  timeoutMin: number;
  params: Record<string, ParamSpec>;
  /** Extra allowed tools on top of the base allowlist. */
  allow: string[];
  /** Pipelines run code steps and child runs instead of one Claude process (P4). */
  pipeline?: boolean;
  /** A pipeline only for some parameters (check-manual-companies without a company). */
  pipelineWhen?: (params: Record<string, unknown>) => boolean;
  /** Hidden from buttons (internal steps of a pipeline, parked tasks). */
  internal?: boolean;
}

/** Read and navigate only: no clicks, typing, form filling or uploads (plan §3.2). */
export const CHROME_READ_TOOLS = [
  'tabs_context_mcp', 'tabs_create_mcp', 'tabs_close_mcp', 'navigate', 'get_page_text', 'find', 'read_page', 'javascript_tool',
].map((t) => `mcp__claude-in-chrome__${t}`);


/**
 * Every tool the Claude in Chrome server offered on 2026-09-30 (seen in a real run's init). --chrome loads all of them even with
 * --strict-mcp-config; the ones a task doesn't need go into --disallowedTools, which removes them from the model's context.
 */
export const CHROME_ALL_TOOLS = [
  'browser_batch', 'computer', 'file_upload', 'find', 'form_input', 'get_page_text', 'gif_creator', 'javascript_tool', 'list_connected_browsers',
  'navigate', 'read_console_messages', 'read_network_requests', 'read_page', 'resize_window', 'select_browser', 'shortcuts_execute',
  'shortcuts_list', 'switch_browser', 'tabs_close_mcp', 'tabs_context_mcp', 'tabs_create_mcp', 'upload_image',
].map((t) => `mcp__claude-in-chrome__${t}`);

const APPLICATIONS_WRITE = ['Edit(applications/**)', 'Write(applications/**)'];

const T = (d: Omit<TaskDef, 'allow' | 'params' | 'chrome'> & Partial<Pick<TaskDef, 'allow' | 'params' | 'chrome'>>): TaskDef =>
  ({ allow: [], params: {}, chrome: false, ...d });

export const TASKS: Record<TaskId, TaskDef> = {
  'process-new-jobs': T({
    // A pipeline (§3.8): sync → manual companies → rules → quick-rank runs → final-check runs. model/limits here are
    // used only if the pipeline isn't registered (then it's one Claude run of the "process new jobs" command).
    id: 'process-new-jobs', label: 'Process new jobs', activity: 'ranking jobs', command: 'process new jobs', pipeline: true,
    model: 'sonnet', effort: 'low', maxTurns: 60, timeoutMin: 30,
    params: { limit: { kind: 'int', min: 1, max: 80, default: 40 }, skipManual: { kind: 'bool' }, all: { kind: 'bool' }, recheck: { kind: 'bool' } },
  }),
  'quick-rank': T({
    id: 'quick-rank', label: 'Quick rank', activity: 'ranking jobs', command: 'process new jobs', internal: true,
    model: 'sonnet', effort: 'low', maxTurns: 60, timeoutMin: 20,
    params: { limit: { kind: 'int', min: 1, max: 80, default: 40 } },
  }),
  'final-check': T({
    id: 'final-check', label: 'Final check', activity: 'checking the best jobs', command: 'process new jobs', internal: true,
    model: 'opus', effort: 'medium', maxTurns: 60, timeoutMin: 25,
    params: { jobIds: { kind: 'jobs', required: true } },
  }),
  'check-manual-companies': T({
    id: 'check-manual-companies', label: 'Check manual companies', activity: 'checking career sites', command: 'check manual companies',
    chrome: true, model: 'sonnet', effort: 'low', maxTurns: 200, timeoutMin: 45, // up to 9 searches × every results page + up to 25 postings
    params: { company: { kind: 'company' }, companies: { kind: 'companies' } },
    allow: CHROME_READ_TOOLS,
    // With one company: one Chrome run. Without: a pipeline with one Chrome run per company (§4).
    pipelineWhen: (p) => !p.company,
  }),
  'process-decisions': T({
    id: 'process-decisions', label: 'Prepare applications', activity: 'preparing applications', command: 'process decisions',
    model: 'opus', effort: 'medium', maxTurns: 60, timeoutMin: 30,
    params: { jobIds: { kind: 'jobs' } }, allow: APPLICATIONS_WRITE,
  }),
  'prepare-job': T({
    id: 'prepare-job', label: 'Prepare one job', activity: 'preparing an application', command: 'prepare <company> <role>',
    model: 'opus', effort: 'medium', maxTurns: 25, timeoutMin: 15,
    params: { jobId: { kind: 'job', required: true } }, allow: APPLICATIONS_WRITE,
  }),
  'cold-emails': T({
    id: 'cold-emails', label: 'Find researchers', activity: 'finding researchers', command: 'cold emails',
    model: 'opus', effort: 'medium', maxTurns: 80, timeoutMin: 40,
    params: { count: { kind: 'int', min: 1, max: 30, default: 10 }, companies: { kind: 'companies' }, candidateIds: { kind: 'ints' } },
    allow: ['Bash(node dashboard/cli research *)'],
  }),
  'cold-emails-company': T({
    id: 'cold-emails-company', label: 'Find someone at a company', activity: 'finding a contact', command: 'cold emails for <Company>',
    model: 'opus', effort: 'medium', maxTurns: 40, timeoutMin: 20,
    params: { company: { kind: 'company', required: true }, jobId: { kind: 'job' } },
    allow: ['Bash(node dashboard/cli research *)'],
  }),
  'follow-ups': T({
    id: 'follow-ups', label: 'Draft follow-ups', activity: 'drafting follow-ups', command: 'follow-ups',
    model: 'sonnet', effort: 'low', maxTurns: 30, timeoutMin: 15,
  }),
  'weekly-review': T({
    id: 'weekly-review', label: 'Weekly review', activity: 'writing the weekly review', command: 'weekly review',
    model: 'sonnet', effort: 'low', maxTurns: 30, timeoutMin: 15,
  }),
  'conference-deadlines': T({
    // Today page "Auto" button: web search for abstract + paper deadlines; they arrive hidden for the owner to pick.
    id: 'conference-deadlines', label: 'Find conference deadlines', activity: 'finding conference deadlines', command: 'conference deadlines',
    model: 'sonnet', effort: 'medium', maxTurns: 80, timeoutMin: 30,
    params: { conferences: { kind: 'text' } },
  }),
  'fix-watcher-errors': T({
    id: 'fix-watcher-errors', label: 'Fix watcher errors', activity: 'fixing the watcher', command: 'fix watcher errors',
    model: 'opus', effort: 'medium', maxTurns: 60, timeoutMin: 30,
    allow: ['Edit(watcher/**)', 'Write(watcher/**)', 'Bash(node watcher/watch.js *)', 'Bash(git add *)', 'Bash(git commit *)', 'Bash(git status *)', 'Bash(git diff *)'],
  }),
};

export const isTaskId = (s: unknown): s is TaskId => (TASK_IDS as readonly unknown[]).includes(s);

/** The task with config.json overrides applied (model, effort, maxTurns, timeoutMin). */
export function effectiveTask(id: TaskId, cfg: Pick<Config, 'runs'>): TaskDef {
  const base = TASKS[id];
  const o: TaskOverride = cfg.runs.tasks[id] || {};
  return {
    ...base,
    model: o.model || base.model,
    effort: o.effort || base.effort,
    maxTurns: Number.isFinite(o.maxTurns) && o.maxTurns! > 0 ? Number(o.maxTurns) : base.maxTurns,
    timeoutMin: Number.isFinite(o.timeoutMin) && o.timeoutMin! > 0 ? Number(o.timeoutMin) : base.timeoutMin,
  };
}
