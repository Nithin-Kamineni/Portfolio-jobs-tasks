// What the web needs to know about each Claude task: which counter shows progress, and the finished line.
import type { Run, RunCounters } from '../../../shared/types';
import type { TaskId } from '../../../server/runs/tasks';

export type { TaskId };

/** The counter the pill shows as "7/25" (or "7 …"). */
export const PROGRESS_COUNTER: Partial<Record<TaskId, { key: keyof RunCounters; noun: string }>> = {
  'process-new-jobs': { key: 'ranked', noun: 'ranked' },
  'quick-rank': { key: 'ranked', noun: 'ranked' },
  'final-check': { key: 'ranked', noun: 'checked' },
  'check-manual-companies': { key: 'jobsAdded', noun: 'added' },
  'process-decisions': { key: 'statuses', noun: 'prepared' },
  'prepare-job': { key: 'statuses', noun: 'prepared' },
  'cold-emails': { key: 'contacts', noun: 'researchers' },
  'cold-emails-company': { key: 'contacts', noun: 'contacts' },
  'follow-ups': { key: 'outreach', noun: 'drafts' },
};

/** "7/25" style progress for a run, or '' when there is nothing to count yet. */
export function progressText(run: Pick<Run, 'task' | 'progress'>): string {
  // a pipeline shows its current step ("Quick rank (Sonnet)")
  const step = run.progress.pipeline?.find((s) => s.status === 'running');
  if (run.progress.pipeline) return step ? step.label : '';
  const c = PROGRESS_COUNTER[run.task as TaskId];
  if (!c) return '';
  const n = run.progress.counters[c.key] || 0;
  if (run.progress.target) return `${n}/${run.progress.target}`;
  return n ? `${n} ${c.noun}` : '';
}

/** One line for the "Claude finished" snackbar. */
export function finishedLine(run: Run): string {
  const c = PROGRESS_COUNTER[run.task as TaskId];
  const n = c ? run.progress.counters[c.key] : 0;
  if (run.status !== 'succeeded') {
    return run.status === 'needs_user' ? `Claude stopped (${run.label}): it needs you` : run.status === 'cancelled' ? `Cancelled: ${run.label}` : `Claude couldn't finish: ${run.label}`;
  }
  if (run.progress.pipeline && run.task === 'process-new-jobs') {
    const m = (run.summary || '').match(/Ranked (\d+) new jobs?|Re-checked (\d+) ranked jobs?/);
    if (m?.[1]) return `Claude finished: ranked ${m[1]} new job${m[1] === '1' ? '' : 's'}`;
    if (m?.[2]) return `Claude finished: re-checked ${m[2]} job${m[2] === '1' ? '' : 's'}`;
    return 'Claude finished: no new jobs to rank';
  }
  if (c && n) {
    const what: Partial<Record<TaskId, string>> = {
      'process-new-jobs': `ranked ${n} job${n === 1 ? '' : 's'}`, 'check-manual-companies': `added ${n} job${n === 1 ? '' : 's'}`,
      'process-decisions': `prepared ${n} application${n === 1 ? '' : 's'}`, 'prepare-job': 'prepared the application',
      'cold-emails': `found ${n} researcher${n === 1 ? '' : 's'}`, 'cold-emails-company': `found ${n} contact${n === 1 ? '' : 's'}`,
      'follow-ups': `drafted ${n} follow-up${n === 1 ? '' : 's'}`,
    };
    return `Claude finished: ${what[run.task as TaskId] || `${n} ${c.noun}`}`;
  }
  return `Claude finished: ${run.label.toLowerCase()}`;
}

export const ACTIVE = (r: Pick<Run, 'status'>) => r.status === 'queued' || r.status === 'running';
