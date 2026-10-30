// Claude steps the dashboard can run for the owner ("Run it now"), or show him how to type himself ("Show me", e.g. on the
// Companies page). They never open by themselves (2026-10-17, the owner: no pop-ups when clicking things). The Home
// "Next steps for Claude" card, the app-bar "Claude to-do" button and the weekly-review step were removed (2026-10-17).
// This is the ONE place these are configured.
// Every `command` here must match a command documented in CLAUDE.md (a test checks this).
import type { ClaudeFacts } from '../../shared/types';
import type { TaskId } from './runs/taskInfo';

export type ClaudeApp = 'claude-code' | 'claude-chrome' | 'claude-desktop' | 'manual';
export type StepPage = 'home' | 'jobs' | 'companies';
export type StepId = 'process-new-jobs' | 'fix-watcher-errors' | 'check-manual-companies';

export interface StepContext {
  company?: string;
  /** Local time. */
  now?: Date;
  /** Settings the user can change (Companies page). */
  hideManualCompanies?: boolean;
  /** The repo folder Claude Code must be opened in (from the server; defaults to REPO_FOLDER). */
  repoFolder?: string;
}

export interface ClaudeStep {
  id: StepId;
  app: ClaudeApp;
  title: string;
  /** Exact text to type. */
  command: (f: ClaudeFacts, c: StepContext) => string;
  /** The static part of the command, for the CLAUDE.md check. */
  commandDoc: string;
  /** Which folder (Claude Code) or page (Claude in Chrome) to open first. */
  place: (f: ClaudeFacts, c: StepContext) => string;
  why: (f: ClaudeFacts, c: StepContext) => string;
  /** Is this step pending right now? */
  active: (f: ClaudeFacts, c: StepContext) => boolean;
  /** Pages where it is offered (buttons, lists). */
  shownOn: StepPage[];
  /** The dashboard can run this itself ("Run it now"): the run task and its parameters. */
  task?: TaskId;
  taskParams?: (f: ClaudeFacts, c: StepContext) => Record<string, unknown>;
}

export const REPO_FOLDER = 'C:\\profitional\\Applications';

export const APP_INFO: Record<ClaudeApp, { label: string; where: string }> = {
  'claude-code': { label: 'Claude Code', where: 'The Code tab of the Claude desktop app, or run `claude` in a terminal.' },
  'claude-chrome': { label: 'Claude in Chrome', where: "The Claude extension's side panel in Chrome." },
  'claude-desktop': { label: 'Claude desktop (chat)', where: 'The chat tab of the Claude desktop app.' },
  manual: { label: 'No Claude needed', where: 'You do these steps yourself, in the browser.' },
};

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const inRepo = (_f: ClaudeFacts, c: StepContext) => `Open the folder ${c.repoFolder || REPO_FOLDER}`;

/** Monday 00:00 (local) of the week containing `d`. */
export function weekStart(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export const CLAUDE_STEPS: ClaudeStep[] = [
  {
    id: 'process-new-jobs', app: 'claude-code', title: 'Rank the new jobs', task: 'process-new-jobs',
    command: () => 'process new jobs', commandDoc: 'process new jobs', place: inRepo,
    why: (f) => `${plural(f.newCount, 'new job')} ${f.newCount === 1 ? 'has' : 'have'} not been checked against your profile. Claude reads each description and writes a fit score and a reason; then you decide here.`,
    active: (f) => f.newCount > 0,
    shownOn: ['home', 'jobs'],
  },
  {
    id: 'fix-watcher-errors', app: 'claude-code', title: 'Fix the job watcher', task: 'fix-watcher-errors',
    command: () => 'fix watcher errors', commandDoc: 'fix watcher errors', place: inRepo,
    why: (f) => `The last watcher run had ${plural(f.watcherErrors.length, 'source error')} (${f.watcherErrors.slice(0, 2).join('; ')}${f.watcherErrors.length > 2 ? '; …' : ''}). Claude reads the errors and fixes the adapters or keywords.`,
    active: (f) => f.watcherErrors.length > 0,
    shownOn: ['home'],
  },
  {
    id: 'check-manual-companies', app: 'claude-chrome', title: 'Check the companies without a feed',
    command: () => 'check manual companies', commandDoc: 'check manual companies',
    place: (f) => `Open Chrome with the Claude extension (any page; Claude opens the ${plural(f.manualCompanies.length, 'career site')} itself).`,
    why: (f) => `${f.manualCompanies.join(', ')} can't be read automatically. ${f.lastManualCheck ? `Last checked ${new Date(f.lastManualCheck).toLocaleDateString()}.` : 'Never checked from here.'} Claude in Chrome opens each career site (one company per run), reads the intern listings and adds the matching new ones to Jobs. "Process new jobs" does this by itself when a company is due.`,
    task: 'check-manual-companies',
    active: (f, c) => !c.hideManualCompanies && (f.manualDue ?? []).length > 0,
    shownOn: ['companies'],
  },
];

export const stepById = (id: StepId): ClaudeStep => CLAUDE_STEPS.find((s) => s.id === id)!;

